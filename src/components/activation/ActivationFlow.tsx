"use client";

/**
 * ACTIVATION FLOW — MAIN ORCHESTRATOR
 *
 * Orchestrates the complete magic-link → provisioning → onboarding pipeline.
 *
 * Flow:
 *   1. Read activation token from URL (?token=<value>)
 *   2. POST to /api/activation/provision to start the session
 *   3. Poll for state every POLL_INTERVAL_MS
 *   4. When provisioning_complete → wait briefly → redirect to /welcome
 *   5. When provisioning_failed → show error state
 *
 * Refresh safety: provisioningId is persisted to sessionStorage so a
 * refresh during provisioning resumes polling rather than restarting.
 *
 * Fast-path: even if provisioning is immediately complete on first poll,
 * the activation screen is shown for MIN_DISPLAY_MS to anchor the experience.
 */

import { useFirstRunState } from "@/lib/first-run/state";
import { deriveProvisioningState } from "@/lib/activation/state-machine";
import type {
  ProvisioningState,
  ProvisioningStatusResponse,
  StartProvisioningResponse,
} from "@/lib/activation/types";
import type { ActivationErrorKind } from "./ActivationError";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { ActivationError } from "./ActivationError";
import { CollectiveReplay } from "./CollectiveReplay";
import { ProvisioningPanel } from "./ProvisioningPanel";

// ─── Constants ────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 1500;
const MIN_DISPLAY_MS = 2800; // Minimum time on activation screen (fast path)
const COMPLETE_DELAY_MS = 1400; // Pause on "Ready" before redirect
const SESSION_KEY = "keon.activation.provisioningId";
const ACTIVATION_DESKTOP_GRID =
  "lg:grid-cols-[minmax(480px,1.08fr)_minmax(560px,0.92fr)] xl:grid-cols-[minmax(520px,1fr)_minmax(660px,1.02fr)]";

// ─── API Helpers ──────────────────────────────────────────────────────────────

async function startProvisioning(token: string): Promise<StartProvisioningResponse> {
  const res = await fetch("/api/activation/provision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body?.error ?? "start_failed"), { status: res.status });
  }
  return res.json();
}

async function pollProvisioningStatus(id: string): Promise<ProvisioningStatusResponse> {
  const res = await fetch(`/api/activation/provision?id=${encodeURIComponent(id)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body?.error ?? "poll_failed"), { status: res.status });
  }
  return res.json();
}

function errorKindFromMessage(message: string): ActivationErrorKind {
  if (message === "activation_token_required") return "token_missing";
  if (message === "token_invalid") return "token_invalid";
  if (message === "token_expired") return "token_expired";
  if (message === "session_not_found") return "token_invalid";
  if (message === "network_error") return "network_error";
  return "unknown";
}

// ─── Hook: Provisioning Flow ─────────────────────────────────────────────────

function useProvisioningFlow(token: string | null) {
  const initialState = deriveProvisioningState("invite_validating");
  const [provisioningId, setProvisioningId] = React.useState<string | null>(null);
  const [state, setState] = React.useState<ProvisioningState>(initialState);
  const [errorKind, setErrorKind] = React.useState<ActivationErrorKind | null>(null);
  const [isComplete, setIsComplete] = React.useState(false);
  const [startedAt] = React.useState(() => Date.now());

  const mountedRef = React.useRef(true);
  React.useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Start provisioning (or resume from sessionStorage) ──
  React.useEffect(() => {
    if (!token) {
      setErrorKind("token_missing");
      return;
    }

    // Resume from a prior session if page was refreshed
    const cached = typeof window !== "undefined" ? sessionStorage.getItem(SESSION_KEY) : null;
    if (cached) {
      setProvisioningId(cached);
      return;
    }

    startProvisioning(token)
      .then(({ provisioningId: id }) => {
        if (!mountedRef.current) return;
        sessionStorage.setItem(SESSION_KEY, id);
        setProvisioningId(id);
      })
      .catch((err: Error & { status?: number }) => {
        if (!mountedRef.current) return;
        setErrorKind(
          err.status === 401 ? "token_invalid" : errorKindFromMessage(err.message)
        );
      });
  }, [token]);

  // ── Poll for status ──
  React.useEffect(() => {
    if (!provisioningId || errorKind || isComplete) return;

    let active = true;

    const poll = async () => {
      try {
        const response = await pollProvisioningStatus(provisioningId);
        if (!active || !mountedRef.current) return;

        setState(response.state);

        if (response.state.internalState === "provisioning_complete") {
          // Ensure we've been on screen for at least MIN_DISPLAY_MS
          const elapsed = Date.now() - startedAt;
          const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
          setTimeout(() => {
            if (!mountedRef.current) return;
            setIsComplete(true);
            sessionStorage.removeItem(SESSION_KEY);
          }, remaining);
        } else if (response.state.internalState === "provisioning_failed") {
          setErrorKind(
            response.failureCode === "token_expired"
              ? "token_expired"
              : "provisioning_failed"
          );
          sessionStorage.removeItem(SESSION_KEY);
        }
      } catch {
        if (!active || !mountedRef.current) return;
        // Network errors: continue polling silently — do not show error on transient failures
        // After 3 consecutive failures we could set error, but for now we stay resilient.
      }
    };

    poll(); // Immediate first poll
    const interval = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [provisioningId, errorKind, isComplete, startedAt]);

  const retry = React.useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(SESSION_KEY);
    }
    setErrorKind(null);
    setIsComplete(false);
    setProvisioningId(null);
    setState(deriveProvisioningState("invite_validating"));
    // Re-trigger the start effect by clearing and re-providing the token
    // (token is from URL, so a page reload achieves this cleanly)
    window.location.reload();
  }, []);

  return { state, errorKind, isComplete, retry };
}

// ─── Transition Overlay ───────────────────────────────────────────────────────

function CompleteTransition({ visible }: { visible: boolean }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-50 flex items-center justify-center",
        "bg-[#060911] transition-opacity duration-700",
        visible ? "opacity-100" : "opacity-0"
      )}
      aria-hidden={!visible}
    >
      <div className="text-center">
        <div className="font-display text-2xl font-semibold tracking-[0.08em] text-[#66FCF1]">
          Workspace ready
        </div>
        <div className="mt-2 font-mono text-[12px] uppercase tracking-[0.22em] text-[#45A29E]/70">
          Opening control plane
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ActivationFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { markProvisioningComplete } = useFirstRunState();

  const { state, errorKind, isComplete, retry } = useProvisioningFlow(token);
  const [showTransition, setShowTransition] = React.useState(false);

  // Handle redirect on completion
  React.useEffect(() => {
    if (!isComplete) return;
    // Persist canonical first-run state before leaving activation.
    markProvisioningComplete();
    setShowTransition(true);
    const timer = setTimeout(() => {
      router.replace("/welcome");
    }, COMPLETE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isComplete, markProvisioningComplete, router]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060911]">
      {/* Background field */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(69,162,158,0.08),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Header */}
      <header className="relative border-b border-white/[0.06] bg-black/20 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1680px] items-center justify-between px-6 py-4 lg:px-10">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/keon_cyan_cube_32_37.png"
              alt="Keon"
              width={26}
              height={30}
              className="h-7 w-auto opacity-90"
            />
            <div className="font-display text-base font-semibold tracking-[0.18em] text-white">
              KEON CONTROL
            </div>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/25">
            Secure workspace activation
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative mx-auto w-full max-w-[1680px] px-6 py-8 lg:px-10 lg:py-10">
        {errorKind ? (
          // ── Error state ──
          <div className={cn("grid min-h-[560px] gap-6 xl:gap-8", ACTIVATION_DESKTOP_GRID)}>
            <ActivationError
              kind={errorKind}
              onRetry={["provisioning_failed", "network_error", "unknown"].includes(errorKind) ? retry : undefined}
            />
            <CollectiveReplay className="hidden lg:flex lg:min-h-[620px]" />
          </div>
        ) : (
          // ── Active provisioning ──
          <div
            className={cn("grid min-h-[560px] gap-6 xl:gap-8", ACTIVATION_DESKTOP_GRID)}
            data-testid="activation-layout"
          >
            <ProvisioningPanel state={state} className="min-h-[400px]" />
            <CollectiveReplay className="lg:min-h-[620px]" />
          </div>
        )}
      </main>

      {/* Secure footer */}
      <footer className="relative mt-auto border-t border-white/[0.04] px-8 py-4">
        <div className="mx-auto flex w-full max-w-[1680px] items-center justify-between px-0 lg:px-2">
          <span className="font-mono text-[10px] text-white/20">
            End-to-end encrypted · TLS 1.3
          </span>
          <span className="font-mono text-[10px] text-white/20">
            Keon Control · Governed Infrastructure
          </span>
        </div>
      </footer>

      {/* Complete transition overlay */}
      <CompleteTransition visible={showTransition} />
    </div>
  );
}
