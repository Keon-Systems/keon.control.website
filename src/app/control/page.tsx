"use client";

import Link from "next/link";
import { ControlGate } from "@/components/onboarding/route-gates";
import { Shell } from "@/components/layout";
import { Card, CardContent, CardHeader, PageContainer, PageHeader } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { useTenantContext } from "@/lib/control-plane/tenant-context";
import { useTenantBinding } from "@/lib/control-plane/tenant-binding";
import { useOnboardingState } from "@/lib/onboarding/store";

const intentLabels: Record<string, string> = {
  "govern-ai-actions": "Govern AI actions",
  "memory-and-context": "Add memory and context",
  "oversight-and-collaboration": "Enable oversight and collaboration",
};

const baselineLabels: Record<string, string> = {
  strict: "Strict",
  balanced: "Balanced",
  flexible: "Flexible",
};

export default function ControlPage() {
  const { me } = useTenantContext();
  const { confirmedTenant, confirmedEnvironment, isConfirmed } = useTenantBinding();
  const {
    state: { selectedIntent, policyBaseline },
  } = useOnboardingState();

  return (
    <ControlGate>
      <Shell>
        <PageContainer>
          <PageHeader
            title="Control Plane"
            description="Your governed workspace is active. Review the current posture and continue with evidence, policy, and operational workflows."
            actions={
              <Button asChild>
                <Link href="/receipts">Open receipts</Link>
              </Button>
            }
          />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_360px]">
            <div className="space-y-6">
              <Card>
                <CardHeader
                  title="Governed system active"
                  description="The guided setup flow completed successfully. This workspace is now operating with a confirmed scope and an active governance baseline."
                />
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <div className="rounded border border-[#384656] bg-[#0B0C10] p-4">
                    <div className="font-mono text-xs uppercase tracking-[0.18em] text-[#66FCF1]">Workspace</div>
                    <div className="mt-3 font-['Rajdhani'] text-2xl font-semibold text-[#F3F5F7]">
                      {confirmedTenant?.name ?? "Confirmed"}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#C5C6C7] opacity-80">
                      Policies, receipts, and actions are now aligned to this workspace.
                    </p>
                  </div>
                  <div className="rounded border border-[#384656] bg-[#0B0C10] p-4">
                    <div className="font-mono text-xs uppercase tracking-[0.18em] text-[#66FCF1]">Baseline</div>
                    <div className="mt-3 font-['Rajdhani'] text-2xl font-semibold text-[#F3F5F7]">
                      {policyBaseline ? baselineLabels[policyBaseline] : "Ready"}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#C5C6C7] opacity-80">
                      The first governed action has already been evaluated and recorded.
                    </p>
                  </div>
                  <div className="rounded border border-[#384656] bg-[#0B0C10] p-4">
                    <div className="font-mono text-xs uppercase tracking-[0.18em] text-[#66FCF1]">Enabled outcomes</div>
                    <div className="mt-3 space-y-2 font-mono text-sm text-[#C5C6C7]">
                      {selectedIntent.map((intent) => (
                        <div key={intent}>{intentLabels[intent] ?? intent}</div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader
                  title="Continue from here"
                  description="The control plane now exposes the deeper tools that rely on the governed foundation you just activated."
                />
                <CardContent className="grid gap-4 md:grid-cols-3">
                  {[
                    {
                      title: "Receipts",
                      body: "Review proof of what happened, why it was decided, and what policy applied.",
                      href: "/receipts",
                      label: "Open receipts",
                    },
                    {
                      title: "Policies",
                      body: "Refine your governance baseline as your workspace matures.",
                      href: "/policies",
                      label: "Open policies",
                    },
                    {
                      title: "Collective",
                      body: "Bring oversight and collaboration into higher-stakes decisions.",
                      href: "/collective",
                      label: "Open collective",
                    },
                  ].map((item) => (
                    <div key={item.title} className="rounded border border-[#384656] bg-[#0B0C10] p-4">
                      <div className="font-['Rajdhani'] text-xl font-semibold text-[#F3F5F7]">{item.title}</div>
                      <p className="mt-2 text-sm leading-6 text-[#C5C6C7] opacity-80">{item.body}</p>
                      <Button asChild variant="secondary" size="sm" className="mt-4">
                        <Link href={item.href}>{item.label}</Link>
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader title="Current posture" description="A concise summary of the active workspace context." />
                <CardContent className="space-y-3 font-mono text-sm text-[#C5C6C7]">
                  <div>Workspace confirmed: {isConfirmed ? "yes" : "no"}</div>
                  <div>Environment: {confirmedEnvironment ?? "none"}</div>
                  <div>Operator mode: {me?.operatorModeEnabled ? "enabled" : "not yet enabled"}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader title="What changed" description="The guided activation flow handled the first-run experience before this control surface opened." />
                <CardContent className="space-y-3 text-sm leading-6 text-[#C5C6C7] opacity-80">
                  <p>The workspace was confirmed before policy or evidence views became relevant.</p>
                  <p>A governance baseline was selected before the first action ran.</p>
                  <p>A governed decision produced a receipt before the control plane became available.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </PageContainer>
      </Shell>
    </ControlGate>
  );
}
