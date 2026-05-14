/**
 * KEON ACTIVATION — PROVISION API (KEO-10)
 *
 * POST /api/activation/provision
 *   Start or resume a durable activation session.
 *   Validates env-backed invite/test tokens, resolves idempotency via DB
 *   (activationTokenHash + activationMode composite index), and calls
 *   startProvisioningRun() for new activations.
 *
 * GET /api/activation/provision?id=<provisioningId>&token=<rawToken>
 *   Poll for current provisioning state from DB.
 *   Token is required and validated against the run's hash — fail closed on mismatch.
 *   Returns the derived user-facing state (never internal state names or raw DB fields).
 *
 * ─── KEO-10 Changes ───────────────────────────────────────────────────────────
 *   - Removed module-level in-memory sessions Map.
 *   - DB ProvisioningRun.state is now the canonical provisioning state source.
 *   - POST: idempotency via resolveActivationToken() (hash + mode composite lookup).
 *   - GET: requires ?token= for unauthenticated polling; verifies ownership via hash.
 *   - ActivationFlow.tsx updated to pass token in GET requests.
 *
 * ─── Security Notes ───────────────────────────────────────────────────────────
 *   - Raw tokens are never persisted, logged, or returned.
 *   - activationTokenHash is stripped at the service boundary (SafeProvisioningRun).
 *   - GET requires the raw token to re-verify run ownership before returning state.
 *   - stateHistory contains only state labels and timestamps — no tokens or PII.
 *
 * ─── startedByEmail Placeholder ───────────────────────────────────────────────
 *   - The raw token carries no email claim in this route (no JWT decoding yet).
 *   - KEON_INVITE_EMAIL env var is used for invite mode if configured.
 *   - Otherwise a sentinel address is written (future: replace with JWT claims).
 */

import "server-only";
import {
  getProvisioningRun,
  mapActivationMode,
  mapActivationSource,
  resolveActivationToken,
  startProvisioningRun,
  type SafeProvisioningRun,
} from "@/server/db/provisioning";
import { deriveProvisioningState } from "@/lib/activation/state-machine";
import {
  INTERNAL_TEST_ACTIVATION,
  INTERNAL_TEST_TENANT_ID,
  INTERNAL_TEST_WORKSPACE_NAME,
} from "@/lib/activation/test-mode";
import type {
  ActivationContextSummary,
  ActivationMode,
  ProvisioningInternalState,
  ProvisioningStatusResponse,
  StartProvisioningResponse,
} from "@/lib/activation/types";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

// ─── Token / Env Helpers ──────────────────────────────────────────────────────

function getConfiguredTestActivationToken(): string {
  return (process.env.KEON_TEST_ACTIVATION_TOKEN ?? "").trim();
}

function getConfiguredInviteActivationTokens(): string[] {
  return [process.env.KEON_INVITE_ACTIVATION_TOKEN, process.env.KEON_INVITE_ACTIVATION_TOKENS]
    .flatMap((value) => (value ?? "").split(/[\n,]/))
    .map((value) => value.trim())
    .filter(Boolean);
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function tokenMatches(candidate: string, expected: string): boolean {
  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);
  return (
    candidateBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(candidateBuffer, expectedBuffer)
  );
}

function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
}

function isTestActivationAllowed(): boolean {
  return !isProductionEnvironment() || process.env.ALLOW_TEST_ACTIVATION === "true";
}

function buildInviteActivationContext(): ActivationContextSummary {
  return {
    mode: "invite",
    source: "invite_token",
    tenantId: optionalEnv("KEON_INVITE_TENANT_ID"),
    tenantName: optionalEnv("KEON_INVITE_TENANT_NAME"),
    workspaceId: optionalEnv("KEON_INVITE_WORKSPACE_ID") ?? optionalEnv("KEON_INVITE_TENANT_ID"),
    workspaceName: optionalEnv("KEON_INVITE_WORKSPACE_NAME") ?? optionalEnv("KEON_INVITE_TENANT_NAME"),
    environment: process.env.KEON_INVITE_ENVIRONMENT === "production" ? "production" : "sandbox",
    uiLabel: optionalEnv("KEON_INVITE_UI_LABEL") ?? "Approved workspace setup",
  };
}

function isLocalSandboxSeedAllowed(): boolean {
  return !isProductionEnvironment() && process.env.KEON_INVITE_ALLOW_SANDBOX_FALLBACK === "true";
}

function buildLocalSandboxSeedActivationContext(): ActivationContextSummary {
  return {
    mode: "invite",
    source: "local_sandbox_seed",
    tenantId: INTERNAL_TEST_TENANT_ID,
    tenantName: INTERNAL_TEST_WORKSPACE_NAME,
    workspaceId: INTERNAL_TEST_TENANT_ID,
    workspaceName: INTERNAL_TEST_WORKSPACE_NAME,
    environment: "sandbox",
    uiLabel: "Local sandbox seed",
  };
}

function getRequestedActivationMode(value: unknown, token: string): ActivationMode {
  if (value === "test") return "test";
  const configuredTestToken = getConfiguredTestActivationToken();
  if (configuredTestToken && token === configuredTestToken) return "test";
  return "invite";
}

// ─── Activation Context from DB Run ──────────────────────────────────────────
// Rebuilds ActivationContextSummary from a SafeProvisioningRun for GET responses.
// The activation context is display-only; values come from env vars and constants,
// not from DB records. The (activationMode, activationSource) pair discriminates
// which context applies — matching the same logic used during POST validation.

function buildActivationFromRun(run: SafeProvisioningRun): ActivationContextSummary {
  if (run.activationMode === "TEST") {
    return INTERNAL_TEST_ACTIVATION;
  }
  // INVITE + TEST_TOKEN = local_sandbox_seed (mapped through TEST_TOKEN in Prisma)
  if (run.activationSource === "TEST_TOKEN") {
    if (isProductionEnvironment()) {
      return buildInviteActivationContext();
    }
    return buildLocalSandboxSeedActivationContext();
  }
  // INVITE + INVITE_TOKEN
  return buildInviteActivationContext();
}

// ─── DB State → ProvisioningInternalState ────────────────────────────────────
// Prisma ProvisioningState values are SCREAMING_SNAKE_CASE.
// ProvisioningInternalState (types.ts) uses the same tokens in snake_case.
// The transform is a direct lowercase — no lookup table required.

function mapDbStateToInternal(dbState: string): ProvisioningInternalState {
  return dbState.toLowerCase() as ProvisioningInternalState;
}

// ─── startedByEmail Placeholder ──────────────────────────────────────────────

function getStartedByEmail(mode: ActivationMode): string {
  if (mode === "test") return "test-activation@keon.internal";
  return optionalEnv("KEON_INVITE_EMAIL") ?? "invite-activation@keon.internal";
}

// ─── POST — Start Provisioning ────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const activationMode = getRequestedActivationMode(body?.activationMode, token);

    if (!token) {
      return NextResponse.json(
        { error: "activation_token_required", message: "A valid activation token is required." },
        { status: 400 }
      );
    }

    // ── Validate token against env-backed allowlist ──────────────────────────
    let activation: ActivationContextSummary;

    if (activationMode === "test") {
      const configuredTestToken = getConfiguredTestActivationToken();

      if (!configuredTestToken) {
        return NextResponse.json(
          { error: "test_activation_not_configured", message: "Test activation is not configured." },
          { status: 503 }
        );
      }

      if (!isTestActivationAllowed()) {
        return NextResponse.json(
          {
            error: "activation_test_token_disabled",
            message: "Test activation tokens are disabled in production.",
          },
          { status: 403 }
        );
      }

      if (token !== configuredTestToken) {
        return NextResponse.json(
          { error: "token_invalid", message: "The test activation token is invalid." },
          { status: 401 }
        );
      }

      activation = INTERNAL_TEST_ACTIVATION;
    } else {
      const configuredInviteTokens = getConfiguredInviteActivationTokens();

      if (configuredInviteTokens.length === 0) {
        return NextResponse.json(
          {
            error: "invite_activation_not_configured",
            message: "Invite activation is not configured.",
          },
          { status: 503 }
        );
      }

      if (!configuredInviteTokens.some((configuredToken) => tokenMatches(token, configuredToken))) {
        return NextResponse.json(
          { error: "token_invalid", message: "The activation link is not recognized." },
          { status: 401 }
        );
      }

      activation = buildInviteActivationContext();

      if (!activation.tenantId || !activation.workspaceId) {
        if (!isLocalSandboxSeedAllowed()) {
          return NextResponse.json(
            {
              error: "invite_workspace_missing",
              message: "Activation link is valid, but no prepared workspace is attached.",
            },
            { status: 409 }
          );
        }
        activation = buildLocalSandboxSeedActivationContext();
      }
    }

    // ── Map to Prisma enums via KEO-9 helpers ─────────────────────────────────
    const prismaMode = mapActivationMode(activationMode);
    const prismaSource = mapActivationSource(activation.source);

    // ── Idempotency: check for existing durable run ───────────────────────────
    const existingRun = await resolveActivationToken(token, prismaMode);
    if (existingRun) {
      return NextResponse.json<StartProvisioningResponse>({
        provisioningId: existingRun.id,
        activation,
      });
    }

    // ── Create new durable provisioning run ───────────────────────────────────
    let run: SafeProvisioningRun;
    try {
      const result = await startProvisioningRun({
        rawToken: token,
        activationMode: prismaMode,
        activationSource: prismaSource,
        startedByEmail: getStartedByEmail(activationMode),
        tenantName: optionalEnv("KEON_INVITE_TENANT_NAME"),
      });
      run = result.run;
    } catch (err) {
      // Idempotency race: concurrent POST with same token won the write.
      // Resolve the now-committed run and return it rather than surfacing the error.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        const racedRun = await resolveActivationToken(token, prismaMode);
        if (racedRun) {
          return NextResponse.json<StartProvisioningResponse>({
            provisioningId: racedRun.id,
            activation,
          });
        }
      }
      throw err;
    }

    if (activationMode === "test") {
      console.info("[activation] accepted internal test activation token", {
        provisioningId: run.id,
        environment: activation.environment,
        tenantId: activation.tenantId,
        workspaceId: activation.workspaceId,
      });
    }

    return NextResponse.json<StartProvisioningResponse>(
      { provisioningId: run.id, activation },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "internal_error", message: "Unable to start provisioning." },
      { status: 500 }
    );
  }
}

// ─── GET — Poll Provisioning State ───────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  const provisioningId = request.nextUrl.searchParams.get("id");
  const rawToken = request.nextUrl.searchParams.get("token");

  if (!provisioningId) {
    return NextResponse.json(
      { error: "provisioning_id_required", message: "Provisioning ID is required." },
      { status: 400 }
    );
  }

  if (!rawToken) {
    return NextResponse.json(
      { error: "token_required", message: "Token is required for unauthenticated polling." },
      { status: 400 }
    );
  }

  // ── Fetch run from DB ─────────────────────────────────────────────────────
  const run = await getProvisioningRun(provisioningId);
  if (!run) {
    return NextResponse.json(
      { error: "session_not_found", message: "Provisioning session not found or has expired." },
      { status: 404 }
    );
  }

  // ── Verify token ownership ────────────────────────────────────────────────
  // Hash the supplied token and confirm it resolves to this exact run.
  // resolveActivationToken performs (hash, activationMode) → SafeProvisioningRun lookup.
  // If the returned run ID does not match the requested ID, fail closed:
  // the token is valid for a different run (different mode or different tenant).
  const tokenRun = await resolveActivationToken(rawToken, run.activationMode);
  if (!tokenRun || tokenRun.id !== provisioningId) {
    return NextResponse.json(
      { error: "token_mismatch", message: "Token does not match this provisioning session." },
      { status: 403 }
    );
  }

  // ── Build response ────────────────────────────────────────────────────────
  const internalState = mapDbStateToInternal(run.state);
  const state = deriveProvisioningState(internalState);
  const activation = buildActivationFromRun(run);

  const response: ProvisioningStatusResponse = {
    provisioningId,
    state,
    activation,
    ...(internalState === "provisioning_complete" && {
      completedAt: run.completedAt?.toISOString() ?? new Date().toISOString(),
    }),
    ...(internalState === "provisioning_failed" && {
      failedAt: run.failedAt?.toISOString() ?? new Date().toISOString(),
      failureCode: run.failureCode ?? "provisioning_failed",
      failureMessage:
        run.failureMessage ?? "Unable to initialize workspace. Your invitation is still valid.",
    }),
  };

  return NextResponse.json(response);
}
