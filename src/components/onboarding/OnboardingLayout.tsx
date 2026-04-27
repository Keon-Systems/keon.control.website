"use client";

import { SetupChecklist } from "@/components/onboarding/setup-checklist";
import { getReadinessLabel, getRequiredCompletionCount, stepLabels } from "@/lib/onboarding/experience";
import { useOnboardingState } from "@/lib/onboarding/store";
import { cn } from "@/lib/utils";
import Image from "next/image";
import * as React from "react";

export function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const { state } = useOnboardingState();
  const { currentStep } = state;
  const completedRequired = getRequiredCompletionCount(state);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(102,252,241,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,176,0,0.08),transparent_24%),#071116] text-[#F4F7F8]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.02),transparent_38%),linear-gradient(180deg,rgba(7,17,22,0.2),rgba(7,17,22,0.9))]" />
      <div className="relative flex min-h-screen flex-col">
        <header className="border-b border-white/10 bg-black/20 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-5">
            <div className="flex items-center gap-3">
              <Image src="/keon_cyan_cube_32_37.png" alt="Keon" width={32} height={37} className="h-8 w-auto" />
              <div>
                <div className="font-display text-lg font-semibold tracking-[0.18em] text-white">KEON CONTROL</div>
                <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#7EE8E0]/80">First-time workspace setup</div>
              </div>
            </div>
            <div className="hidden min-w-[280px] flex-1 items-center justify-center lg:flex">
              <div className="w-full max-w-md space-y-2">
                <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.22em] text-white/70">
                  <span>{completedRequired} of 4 required steps complete</span>
                  <span>{stepLabels[currentStep]}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#7EE8E0_0%,#B6F09C_100%)] transition-all duration-500"
                    style={{ width: `${(completedRequired / 4) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-mono text-xs text-white/70">
              {getReadinessLabel(state)}
            </div>
          </div>
        </header>

        <main className="relative flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:36px_36px] opacity-20" />
          <div className="relative grid w-full max-w-7xl gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div
              className={cn(
                "relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,20,27,0.96),rgba(3,9,13,0.94))] shadow-[0_24px_120px_rgba(0,0,0,0.45)]",
                "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[linear-gradient(90deg,transparent,rgba(126,232,224,0.8),transparent)]"
              )}
            >
              <div className="relative px-6 py-8 sm:px-10 sm:py-10">{children}</div>
            </div>
            <div className="relative">
              <SetupChecklist />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
