"use client";

import * as React from "react";
import { DoctrineExplainer, TenantScopeGuard } from "@/components/control-plane";
import { Shell } from "@/components/layout";
import { Card, CardContent, CardHeader, PageContainer, PageHeader } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTenantBinding } from "@/lib/control-plane/tenant-binding";

const baselines = [
  {
    id: "balanced",
    name: "Balanced governance",
    summary: "Default enterprise posture with moderate deny thresholds and human escalation for sensitive actions.",
    denyThreshold: "Deny when trust score falls below 0.72 or when receipt lineage is incomplete.",
    escalation: "Escalate to tenant admin for high-risk writes and to collective review for irreversible cross-boundary actions.",
    signerRequirements: "One tenant signer for reversible actions; two signers for irreversible or spend-bearing actions.",
    boundaryPosture: "Production traffic allowed through the governed boundary only after sandbox validation completes.",
    hashSeed: "balanced-72-admin2-prod",
  },
  {
    id: "strict",
    name: "Strict governance",
    summary: "High-assurance posture for regulated tenants with aggressive denial and stronger signer quorum.",
    denyThreshold: "Deny when trust score falls below 0.86 or when any proof artifact is stale.",
    escalation: "Immediate escalation to compliance and security review for privileged writes, exports, or policy overrides.",
    signerRequirements: "Two tenant signers plus one oversight signer for irreversible effects or policy changes.",
    boundaryPosture: "Production remains sealed until sandbox evidence and signer quorum are both satisfied.",
    hashSeed: "strict-86-oversight3-sealed",
  },
  {
    id: "expedited",
    name: "Expedited operations",
    summary: "Faster path for activated operators, with tighter receipt monitoring rather than lower evidence requirements.",
    denyThreshold: "Deny when trust score falls below 0.78 or when policy drift is detected against the active baseline.",
    escalation: "Escalate only on high-risk writes, external effects, or repeated denials within the same scope.",
    signerRequirements: "One signer for most actions, second signer required for policy edits and external execution effects.",
    boundaryPosture: "Production allowed after baseline publication and first governed action receipt verification.",
    hashSeed: "expedited-78-signer2-live",
  },
] as const;

function policyHash(input: string, scope: string) {
  const source = `${input}:${scope}`;
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
  }
  return `pol_${hash.toString(16).padStart(8, "0")}`;
}

export default function PoliciesPage() {
  const { isConfirmed, confirmedTenant, confirmedEnvironment } = useTenantBinding();
  const [selectedBaselineId, setSelectedBaselineId] = React.useState<(typeof baselines)[number]["id"]>("balanced");
  const selectedBaseline = baselines.find((baseline) => baseline.id === selectedBaselineId) ?? baselines[0];
  const scope = `${confirmedTenant?.id ?? "unbound"}:${confirmedEnvironment ?? "none"}`;
  const hash = policyHash(selectedBaseline.hashSeed, scope);

  return (
    <Shell>
      <PageContainer>
        <PageHeader
          title="Policies"
          description="Choose the baseline that will bind future receipts, make consequences visible, and publish the policy hash for the confirmed tenant scope."
          actions={<Badge variant="warning">Baseline required</Badge>}
        />

        {!isConfirmed && <TenantScopeGuard description="Policy baselines must be selected against an explicitly confirmed tenant and environment." />}

        {isConfirmed && confirmedTenant && (
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
              <Card>
                <CardHeader title="Baseline selection" description="The policy experience is now organized around baseline choice and visible consequences, not generic placeholder cards." />
                <CardContent className="space-y-4">
                  {baselines.map((baseline) => {
                    const active = baseline.id === selectedBaselineId;
                    return (
                      <button
                        key={baseline.id}
                        type="button"
                        onClick={() => setSelectedBaselineId(baseline.id)}
                        className={`rounded border p-4 text-left transition-colors ${
                          active
                            ? "border-[#66FCF1] bg-[#66FCF1]/8"
                            : "border-[#384656] bg-[#0B0C10] hover:border-[#66FCF1]/40"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-['Rajdhani'] text-lg font-semibold text-[#C5C6C7]">{baseline.name}</div>
                            <p className="mt-2 font-mono text-sm leading-6 text-[#C5C6C7] opacity-80">{baseline.summary}</p>
                          </div>
                          {active && <Badge variant="healthy">Selected</Badge>}
                        </div>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader title="Publication preview" description="This published hash is what future receipts will bind against for the current confirmed scope." />
                <CardContent className="space-y-3 font-mono text-sm text-[#C5C6C7]">
                  <div>Tenant: {confirmedTenant.name}</div>
                  <div>Environment: {confirmedEnvironment}</div>
                  <div>Baseline: {selectedBaseline.name}</div>
                  <div>Policy hash: {hash}</div>
                  <Button>Publish baseline</Button>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Deny threshold", body: selectedBaseline.denyThreshold },
                { label: "Escalation rules", body: selectedBaseline.escalation },
                { label: "Signer requirements", body: selectedBaseline.signerRequirements },
                { label: "Boundary posture", body: selectedBaseline.boundaryPosture },
              ].map((item) => (
                <Card key={item.label}>
                  <CardHeader title={item.label} />
                  <CardContent className="font-mono text-sm leading-6 text-[#C5C6C7] opacity-80">{item.body}</CardContent>
                </Card>
              ))}
            </div>

            <DoctrineExplainer
              title="What the baseline changes"
              description="Future receipts bind to the published policy hash, so baseline selection must expose the consequences up front."
              points={[
                {
                  label: "Visible denial",
                  detail: "The deny threshold states when Keon refuses execution rather than treating denials as incidental implementation details.",
                },
                {
                  label: "Escalation path",
                  detail: "Escalation rules clarify who is paged and when oversight enters the loop before operators assume authority the interface does not grant.",
                },
                {
                  label: "Receipt binding",
                  detail: `Publishing ${hash} makes the active baseline inspectable on future receipts for ${confirmedTenant.name}.`,
                },
              ]}
            />
          </div>
        )}
      </PageContainer>
    </Shell>
  );
}
