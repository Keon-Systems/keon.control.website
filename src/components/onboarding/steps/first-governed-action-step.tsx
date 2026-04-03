"use client";

import { StepShell } from "@/components/onboarding/step-shell";
import { Button } from "@/components/ui/button";
import { useOnboardingState } from "@/lib/onboarding/store";
import type { OnboardingIntent, PolicyBaseline } from "@/lib/onboarding/state-machine";
import { cn } from "@/lib/utils";
import * as React from "react";

type GovernanceLevel = "strict" | "flexible";
type SequenceStage = "intent" | "evaluation" | "policy" | "decision" | "receipt";
type Outcome = "DENIED" | "ALLOWED";

interface ScenarioDefinition {
  intent: string;
  evaluation: string;
  strict: {
    outcome: Outcome;
    explanation: string;
    policyReference: string;
    receiptId: string;
  };
  flexible: {
    outcome: Outcome;
    explanation: string;
    policyReference: string;
    receiptId: string;
  };
}

const stageOrder: SequenceStage[] = ["intent", "evaluation", "policy", "decision", "receipt"];
const stageDelays = [420, 620, 520, 520] as const;
const receiptTimestamp = "2026-03-27T14:00:12.000Z";

const scenarioByIntent: Record<OnboardingIntent, ScenarioDefinition> = {
  "govern-ai-actions": {
    intent: "AI attempts to send customer data to external API",
    evaluation: "The system detects regulated customer data leaving the workspace boundary.",
    strict: {
      outcome: "DENIED",
      explanation: "Blocked by data exfiltration policy.",
      policyReference: "data-exfiltration-policy#8d2f1a",
      receiptId: "rcpt_8d2f1a",
    },
    flexible: {
      outcome: "ALLOWED",
      explanation: "Permitted under approved integration policy.",
      policyReference: "approved-integration-policy#51be4c",
      receiptId: "rcpt_51be4c",
    },
  },
  "memory-and-context": {
    intent: "AI attempts to send customer context to external API",
    evaluation: "The system detects protected memory leaving the approved workspace boundary.",
    strict: {
      outcome: "DENIED",
      explanation: "Blocked by data exfiltration policy.",
      policyReference: "memory-boundary-policy#91ac4d",
      receiptId: "rcpt_91ac4d",
    },
    flexible: {
      outcome: "ALLOWED",
      explanation: "Permitted under approved integration policy.",
      policyReference: "approved-context-transfer#37f0b2",
      receiptId: "rcpt_37f0b2",
    },
  },
  "oversight-and-collaboration": {
    intent: "AI attempts to share customer data with external collaborator",
    evaluation: "The system detects sensitive data moving to an outside destination.",
    strict: {
      outcome: "DENIED",
      explanation: "Blocked by data exfiltration policy.",
      policyReference: "oversight-boundary-policy#77d931",
      receiptId: "rcpt_77d931",
    },
    flexible: {
      outcome: "ALLOWED",
      explanation: "Permitted under approved integration policy.",
      policyReference: "approved-collaboration-policy#2ae84f",
      receiptId: "rcpt_2ae84f",
    },
  },
};

function toLabel(level: GovernanceLevel | PolicyBaseline | null) {
  if (!level) {
    return "Not set";
  }

  return level.charAt(0).toUpperCase() + level.slice(1);
}

export function FirstGovernedActionStep() {
  const {
    state: { selectedIntent, policyBaseline },
    completeFirstGovernedAction,
  } = useOnboardingState();

  const scenarioIntent = selectedIntent[0] ?? "govern-ai-actions";
  const scenario = scenarioByIntent[scenarioIntent];
  const [governanceLevel, setGovernanceLevel] = React.useState<GovernanceLevel>("strict");
  const [stageIndex, setStageIndex] = React.useState(0);
  const [sequenceKey, setSequenceKey] = React.useState(0);
  const [intentEntered, setIntentEntered] = React.useState(false);

  const timersRef = React.useRef<number[]>([]);
  const runState = governanceLevel === "strict" ? scenario.strict : scenario.flexible;
  const selectedBaselineLabel = toLabel(policyBaseline);

  const clearTimers = React.useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const startSequence = React.useCallback(() => {
    clearTimers();
    setStageIndex(0);
    setIntentEntered(false);
    setSequenceKey((current) => current + 1);

    timersRef.current.push(window.setTimeout(() => setIntentEntered(true), 40));

    let elapsed = 0;
    stageDelays.forEach((delay, index) => {
      elapsed += delay;
      timersRef.current.push(
        window.setTimeout(() => {
          setStageIndex(index + 1);
        }, elapsed)
      );
    });
  }, [clearTimers]);

  React.useEffect(() => {
    startSequence();
    return () => clearTimers();
  }, [clearTimers, governanceLevel, startSequence]);

  const receiptReady = stageOrder[stageIndex] === "receipt";

  return (
    <StepShell
      eyebrow="Step 4"
      title="Watch a governed action resolve"
      description="The same action runs through the same sequence every time. Change the governance level to see how the decision changes under different rules."
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => startSequence()}
            className="font-mono text-xs uppercase tracking-[0.2em] text-white/60 transition hover:text-white"
          >
            Replay decision
          </button>
          <Button size="lg" disabled={!receiptReady} onClick={completeFirstGovernedAction}>
            Continue
          </Button>
        </div>
      }
    >
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.22em] text-[#7EE8E0]">Change governance level</div>
            <p className="mt-2 text-sm leading-6 text-white/68">
              Your setup selected <span className="text-white">{selectedBaselineLabel}</span>. This preview starts in <span className="text-white">Strict</span> so you can see what gets blocked first.
            </p>
          </div>
          <div className="inline-flex rounded-full border border-white/10 bg-black/20 p-1">
            {(["strict", "flexible"] as GovernanceLevel[]).map((level) => {
              const active = governanceLevel === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => {
                    if (governanceLevel === level) {
                      startSequence();
                      return;
                    }

                    setGovernanceLevel(level);
                  }}
                  className={cn(
                    "rounded-full px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] transition",
                    active ? "bg-white text-[#061117]" : "text-white/60 hover:text-white"
                  )}
                >
                  {toLabel(level)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-6 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,20,27,0.92),rgba(3,9,13,0.96))] p-6 sm:p-8">
          <div
            key={`intent-${sequenceKey}`}
            className={cn(
              "rounded-[24px] border border-white/10 bg-black/20 p-6 transition-all duration-500",
              intentEntered ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            )}
          >
            <div className="font-mono text-xs uppercase tracking-[0.24em] text-[#7EE8E0]">Incoming Action</div>
            <div className="mt-4 font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">{scenario.intent}</div>
          </div>

          <div className="space-y-4">
            <div className="font-mono text-xs uppercase tracking-[0.24em] text-white/60">Intent to receipt</div>
            <div className="grid gap-3 md:grid-cols-5">
              {stageOrder.map((stage, index) => {
                const completed = index < stageIndex;
                const active = index === stageIndex;

                return (
                  <div
                    key={stage}
                    className={cn(
                      "rounded-[22px] border px-4 py-4 text-center transition-all duration-300",
                      completed && "border-[#7EE8E0]/35 bg-[#7EE8E0]/10",
                      active && "border-white/40 bg-white/[0.08]",
                      !completed && !active && "border-white/10 bg-black/20"
                    )}
                  >
                    <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/55">{index + 1}</div>
                    <div className="mt-2 text-sm font-medium uppercase tracking-[0.12em] text-white">
                      {stage === "intent" && "Intent"}
                      {stage === "evaluation" && "Evaluation"}
                      {stage === "policy" && "Policy"}
                      {stage === "decision" && "Decision"}
                      {stage === "receipt" && "Receipt"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[24px] border border-white/10 bg-black/20 p-6">
              <div className="font-mono text-xs uppercase tracking-[0.22em] text-white/60">Evaluation in progress</div>
              <p className="mt-4 text-base leading-7 text-white/78">{scenario.evaluation}</p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-black/20 p-6">
              <div className="font-mono text-xs uppercase tracking-[0.22em] text-white/60">Policy engaged</div>
              <p className="mt-4 text-base leading-7 text-white/78">
                {governanceLevel === "strict"
                  ? "Strict governance stops unapproved external data transfer before it can run."
                  : "Flexible governance permits the same action when it matches an approved integration path."}
              </p>
            </div>
          </div>

          <div
            className={cn(
              "rounded-[28px] border p-6 transition-all duration-500",
              stageIndex >= 3 ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
              runState.outcome === "DENIED"
                ? "border-[#FF8A73]/35 bg-[rgba(255,138,115,0.1)]"
                : "border-[#B6F09C]/35 bg-[rgba(182,240,156,0.1)]"
            )}
          >
            <div className="font-mono text-xs uppercase tracking-[0.24em] text-white/60">Decision rendered</div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="font-display text-5xl font-semibold text-white">{stageIndex >= 3 ? runState.outcome : "..."}</div>
                <p className="mt-3 text-base leading-7 text-white/76">{stageIndex >= 3 ? runState.explanation : "Preparing decision..."}</p>
                {stageIndex >= 3 && runState.outcome === "DENIED" ? (
                  <p className="mt-3 text-sm leading-6 text-white/58">This would have executed in a typical system.</p>
                ) : null}
              </div>
              <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-white/60">
                {toLabel(governanceLevel)} governance
              </div>
            </div>
          </div>

          <div
            className={cn(
              "rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 transition-all duration-500",
              receiptReady ? "translate-y-0 opacity-100 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" : "translate-y-3 opacity-0"
            )}
          >
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-mono text-xs uppercase tracking-[0.24em] text-[#7EE8E0]">Receipt generated</div>
                <div className="mt-2 text-sm leading-6 text-white/68">This decision is recorded and cannot be altered.</div>
              </div>
              <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-white/60">
                Locked record
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/55">Receipt ID</div>
                <div className="mt-3 font-mono text-sm text-white/85">{runState.receiptId}</div>
              </div>
              <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/55">Timestamp</div>
                <div className="mt-3 font-mono text-sm text-white/85">{receiptTimestamp}</div>
              </div>
              <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/55">Policy reference</div>
                <div className="mt-3 font-mono text-sm text-white/85">{runState.policyReference}</div>
              </div>
              <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/55">Outcome</div>
                <div className="mt-3 font-mono text-sm text-white/85">{runState.outcome}</div>
              </div>
            </div>

            <div className="mt-5 space-y-2 text-sm leading-6 text-white/62">
              <p>Every action is traceable and verifiable.</p>
              <p>This proof can be exported and audited.</p>
            </div>
          </div>
        </div>
      </div>
    </StepShell>
  );
}
