"use client";

import { StepShell } from "@/components/onboarding/step-shell";
import { Button } from "@/components/ui/button";
import { useOnboardingState } from "@/lib/onboarding/store";
import type { IntegrationMode } from "@/lib/onboarding/state-machine";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import * as React from "react";

const COLLECTIVE_SHOWCASE_URL = "/collective/showcase";

export function IntegrationSelectionStep() {
  const router = useRouter();
  const { dispatch } = useOnboardingState();
  const [selected, setSelected] = React.useState<IntegrationMode | undefined>(undefined);

  const toggleCard = (mode: IntegrationMode) => {
    setSelected((prev) => (prev === mode ? undefined : mode));
  };

  const handleContinue = () => {
    dispatch({
      type: "ADVANCE_INTEGRATION",
      ...(selected ? { payload: { selectedMode: selected } } : {}),
    });
    router.replace("/setup?step=guardrails");
  };

  return (
    <StepShell
      eyebrow="Step 3 of 5"
      title="How do you want governed decisions to happen?"
      description="This is not a vendor choice. It determines how Keon evaluates, challenges, and seals every decision."
      footer={
        <div className="flex items-center gap-4">
          <Button size="lg" onClick={handleContinue}>
            Continue
          </Button>
          <p className="font-mono text-xs text-white/32">
            You can start with BYO AI and upgrade later.
          </p>
        </div>
      }
    >
      {/* Super-labels */}
      <div className="grid grid-cols-[1fr_auto_1fr] mb-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/28 pl-0.5">
          Governance Layer
        </span>
        <span />
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/28 pl-0.5">
          Decision System
        </span>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch">
        {/* BYO AI */}
        <button
          type="button"
          role="button"
          aria-pressed={selected === "BYO_AI"}
          aria-label="BYO AI"
          onClick={() => toggleCard("BYO_AI")}
          className={cn(
            "rounded-[24px] border p-7 text-left flex flex-col transition-all duration-200",
            selected === "BYO_AI"
              ? "border-[#B6F09C]/50 bg-[linear-gradient(175deg,rgba(182,240,156,0.08)_0%,rgba(182,240,156,0.03)_100%)]"
              : "border-white/10 bg-white/[0.03] hover:border-white/20"
          )}
        >
          <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-[#B6F09C] mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-[#B6F09C]" />
            BYO AI
          </div>
          <div className="font-display text-[22px] font-bold text-white leading-tight mb-2">
            Govern the AI you already use
          </div>
          <div className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-[#B6F09C]/55 mb-3">
            Best for existing AI stacks
          </div>
          <p className="text-sm leading-[1.72] text-white/62 mb-5 flex-1">
            Route your existing models and providers through Keon&apos;s governance layer via MCP
            Gateway. Every action is intercepted, policy-evaluated, and receipted — without
            replacing your stack.
          </p>
          <ul className="space-y-1.5">
            {[
              "Connect existing providers via MCP Gateway",
              "Fastest path to governed execution",
              "No changes to your model setup",
              "Policy-bound, receipt-verified output",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-[12px] text-white/65 leading-[1.5]">
                <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-white/25" />
                {item}
              </li>
            ))}
          </ul>
        </button>

        {/* Divider */}
        <div className="flex flex-col items-center justify-center gap-1.5 px-4 font-mono text-[9px] uppercase tracking-[0.12em] text-white/20">
          <div className="w-px flex-1 bg-white/8" />
          <span>or</span>
          <div className="w-px flex-1 bg-white/8" />
        </div>

        {/* Collective */}
        <button
          type="button"
          role="button"
          aria-pressed={selected === "COLLECTIVE"}
          aria-label="Keon Collective"
          onClick={() => toggleCard("COLLECTIVE")}
          className={cn(
            "rounded-[24px] border p-7 text-left flex flex-col transition-all duration-200",
            selected === "COLLECTIVE"
              ? "border-[#7EE8E0]/50 bg-[linear-gradient(175deg,rgba(126,232,224,0.12)_0%,rgba(126,232,224,0.04)_60%)]"
              : "border-[#7EE8E0]/28 bg-[linear-gradient(175deg,rgba(126,232,224,0.07)_0%,rgba(126,232,224,0.02)_60%,rgba(6,17,23,0.2)_100%)]"
          )}
        >
          <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-[#7EE8E0] mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7EE8E0]" />
            Keon Collective
          </div>
          <div className="font-display text-[22px] font-bold text-white leading-tight mb-2">
            Deliberation, not generation
          </div>
          <div className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-[#7EE8E0]/45 mb-3">
            For high-stakes decisions that demand more than one output
          </div>
          <p className="text-sm leading-[1.72] text-white/62 mb-5 flex-1">
            Replace single-model output with a governed deliberation process. Proposals branch,
            face adversarial challenge, converge through voting, and collapse into a
            cryptographically sealed outcome.
          </p>
          <ul className="space-y-1.5 mb-5">
            {[
              "Branching analysis across multiple agents",
              "Built-in adversarial challenge phase",
              "Convergence via weighted vote",
              "Cryptographically sealed, append-only outcome",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-[12px] text-white/65 leading-[1.5]">
                <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-[#7EE8E0]/45" />
                {item}
              </li>
            ))}
          </ul>

          {/* Micro-preview */}
          <MicroPreview />

          {/* CTA */}
          <a
            href={COLLECTIVE_SHOWCASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-auto inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#7EE8E0] border border-[#7EE8E0]/28 rounded-[6px] px-4 py-2 bg-[#7EE8E0]/05 hover:bg-[#7EE8E0]/11 hover:border-[#7EE8E0]/48 transition-colors"
          >
            Watch a decision unfold{" "}
            <span className="text-[11px]" aria-hidden>↗</span>
          </a>
        </button>
      </div>
    </StepShell>
  );
}

function MicroPreview() {
  return (
    <div className="rounded-[14px] border border-[#7EE8E0]/14 bg-[#040c12]/70 px-3.5 py-3.5 mb-5">
      <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#7EE8E0]/38 mb-3">
        Deliberation lifecycle
      </div>
      <div className="flex flex-col items-center gap-0">
        {/* Intent node */}
        <div className="rounded-[6px] border border-[#7EE8E0]/30 bg-[#7EE8E0]/10 px-3.5 py-1 font-mono text-[8.5px] uppercase tracking-[0.1em] text-[#7EE8E0]/75 z-10">
          Intent submitted
        </div>

        {/* Travel line */}
        <div className="w-px h-2.5 bg-[#7EE8E0]/18" />

        {/* Horizontal spread */}
        <div className="w-44 h-px bg-gradient-to-r from-transparent via-[#7EE8E0]/20 to-transparent" />

        {/* Branches */}
        <div className="flex w-full justify-center gap-1.5">
          {(
            [
              { label: "Branch A\nProceed", variant: "default" },
              { label: "Adversarial\nChallenge", variant: "adversarial" },
              { label: "Branch C\nSynthesize", variant: "default" },
            ] as const
          ).map(({ label, variant }) => (
            <div key={label} className="flex flex-col items-center flex-1 max-w-[78px]">
              <div className="w-px h-2 bg-[#7EE8E0]/15" />
              <div
                className={cn(
                  "rounded-[5px] px-1.5 py-1 font-mono text-[7.5px] uppercase tracking-[0.06em] text-center whitespace-pre-line border leading-[1.4]",
                  variant === "adversarial"
                    ? "border-[#F4D35E]/45 text-[#F4D35E]/85 bg-[#F4D35E]/07 animate-[adv-pulse_2.8s_ease-in-out_infinite]"
                    : "border-white/10 text-white/45"
                )}
              >
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Converge bar */}
        <div className="w-44 h-px bg-gradient-to-r from-transparent via-[#7EE8E0]/18 to-transparent mt-1" />
        <div className="w-px h-2 bg-[#7EE8E0]/18" />

        {/* Sealed node */}
        <div className="flex items-center gap-1.5 rounded-[6px] border border-[#7EE8E0]/38 bg-[#7EE8E0]/09 px-3 py-1 font-mono text-[8.5px] uppercase tracking-[0.12em] text-[#7EE8E0]/88 animate-[seal-snap_3.6s_ease-in-out_infinite]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7EE8E0] animate-[dot-snap_3.6s_ease-in-out_infinite]" />
          Sealed · Receipt issued
        </div>
      </div>
    </div>
  );
}
