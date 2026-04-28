"use client";

import { getChecklistItems, getCurrentBlocker, getReadinessLabel } from "@/lib/onboarding/experience";
import { useOnboardingState } from "@/lib/onboarding/store";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Clock3 } from "lucide-react";
import Link from "next/link";

function StatusIcon({ status }: { status: "complete" | "current" | "upcoming" }) {
  if (status === "complete") {
    return <CheckCircle2 className="h-4 w-4 text-[#7EE8E0]" />;
  }

  if (status === "current") {
    return <Clock3 className="h-4 w-4 text-[#B6F09C]" />;
  }

  return <Circle className="h-4 w-4 text-white/35" />;
}

export function SetupChecklist() {
  const { state } = useOnboardingState();
  const { required, optional } = getChecklistItems(state);

  return (
    <aside className="space-y-6 rounded-[24px] border border-white/10 bg-black/20 p-5">
      <div className="space-y-2">
        <div className="font-mono text-xs uppercase tracking-[0.24em] text-[#7EE8E0]">Readiness</div>
        <div className="font-display text-2xl font-semibold text-white">{getReadinessLabel(state)}</div>
        <p className="text-sm leading-6 text-white/70">{getCurrentBlocker(state)}</p>
      </div>

      <div className="space-y-3">
        <div className="font-mono text-xs uppercase tracking-[0.24em] text-white/55">Required setup</div>
        {required.map((item) => {
          if (item.status === "upcoming") {
            return (
              <div
                key={`${item.id}-${item.title}`}
                aria-disabled="true"
                className="flex cursor-not-allowed items-start gap-3 rounded-[18px] border border-white/10 bg-black/20 p-4 opacity-40"
              >
                <StatusIcon status={item.status} />
                <div className="space-y-1">
                  <div className="font-medium text-white">{item.title}</div>
                  <div className="text-sm leading-6 text-white/65">{item.description}</div>
                </div>
              </div>
            );
          }

          return (
            <Link
              key={`${item.id}-${item.title}`}
              href={item.href}
              className={cn(
                "flex items-start gap-3 rounded-[18px] border p-4 transition",
                item.status === "current"
                  ? "border-[#7EE8E0]/40 bg-[#7EE8E0]/10"
                  : "border-white/10 bg-white/[0.04]"
              )}
            >
              <StatusIcon status={item.status} />
              <div className="space-y-1">
                <div className="font-medium text-white">{item.title}</div>
                <div className="text-sm leading-6 text-white/65">{item.description}</div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="space-y-3">
        <div className="font-mono text-xs uppercase tracking-[0.24em] text-white/55">Optional next</div>
        {optional.map((item) => (
          <Link key={`${item.href}-${item.title}`} href={item.href} className="block rounded-[18px] border border-white/10 bg-black/20 p-4 transition hover:border-white/20">
            <div className="font-medium text-white">{item.title}</div>
            <div className="mt-1 text-sm leading-6 text-white/65">{item.description}</div>
          </Link>
        ))}
      </div>
    </aside>
  );
}
