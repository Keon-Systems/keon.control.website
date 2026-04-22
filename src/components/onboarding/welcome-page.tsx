"use client";

import { Button } from "@/components/ui/button";
import { useOnboardingState } from "@/lib/onboarding/store";
import { useRouter } from "next/navigation";

export function WelcomePage() {
  const router = useRouter();
  const { startSetup } = useOnboardingState();

  return (
    <div className="space-y-10">
      <div className="space-y-4 border-b border-white/10 pb-8">
        <div className="font-mono text-xs uppercase tracking-[0.26em] text-[#7EE8E0]">Welcome</div>
        <h1 className="max-w-4xl font-display text-5xl font-semibold leading-tight text-white sm:text-6xl">
          Keon Control makes AI-driven work accountable before it reaches your systems.
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-white/72">
          Keon ensures important AI-driven actions in your environment are authorized, traceable, and reviewable before they happen. Let&apos;s get your workspace ready.
        </p>
      </div>

      <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
        <div className="font-mono text-xs uppercase tracking-[0.22em] text-[#B6F09C]">What setup will do</div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Align the workspace",
              body: "Confirm where Keon should apply guardrails, receipts, and later integrations.",
            },
            {
              title: "Apply starter guardrails",
              body: "Choose a sensible starting approval posture instead of inheriting hidden defaults.",
            },
            {
              title: "Show a finish line",
              body: "Leave setup with a clear ready state and a direct path into the workspace overview.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-[18px] border border-white/10 bg-black/20 p-5">
              <div className="font-display text-2xl font-semibold text-white">{item.title}</div>
              <p className="mt-3 text-sm leading-7 text-white/70">{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[24px] border border-white/10 bg-black/20 p-6">
        <div className="font-mono text-xs uppercase tracking-[0.22em] text-white/60">Trust and timing</div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            {
              label: "Guided",
              body: "Setup takes only a few guided steps and clearly separates required work from optional follow-up.",
            },
            {
              label: "Honest",
              body: "If a page later uses sample data, Keon will say so instead of implying it came from your systems.",
            },
            {
              label: "Deferred",
              body: "Advanced diagnostics stay available later, after the workspace is ready for normal use.",
            },
          ].map((item) => (
            <div key={item.label} className="rounded-[18px] border border-white/10 bg-black/20 p-5">
              <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/60">{item.label}</div>
              <p className="mt-3 text-sm leading-7 text-white/72">{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          size="lg"
          onClick={() => {
            startSetup();
            router.push("/setup?step=goals");
          }}
        >
          Set up workspace
        </Button>
      </div>
    </div>
  );
}
