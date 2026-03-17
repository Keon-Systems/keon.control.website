"use client";

import * as React from "react";
import { Card, CardHeader, CardContent } from "@/components/layout/page-container";
import { CheckCircle2, XCircle, ToggleLeft, ToggleRight } from "lucide-react";

interface Entitlement {
  key: string;
  label: string;
  enabled: boolean;
  override?: boolean;
}

interface EntitlementsListProps {
  tenantId: string;
  plan: string;
}

const PLAN_ENTITLEMENTS: Record<string, Entitlement[]> = {
  enterprise: [
    { key: "audit_trail", label: "Full Audit Trail", enabled: true },
    { key: "sso", label: "SSO / SAML", enabled: true },
    { key: "api_access", label: "API Access", enabled: true },
    { key: "evidence_export", label: "Evidence Pack Export", enabled: true },
    { key: "custom_policies", label: "Custom Policies", enabled: true },
    { key: "dedicated_support", label: "Dedicated Support", enabled: true },
    { key: "sla_99_9", label: "99.9% SLA", enabled: true },
    { key: "ai_triage", label: "AI Incident Triage (Beta)", enabled: false, override: true },
  ],
  business: [
    { key: "audit_trail", label: "Full Audit Trail", enabled: true },
    { key: "sso", label: "SSO / SAML", enabled: false },
    { key: "api_access", label: "API Access", enabled: true },
    { key: "evidence_export", label: "Evidence Pack Export", enabled: true },
    { key: "custom_policies", label: "Custom Policies", enabled: false },
    { key: "dedicated_support", label: "Dedicated Support", enabled: false },
    { key: "sla_99_9", label: "99.9% SLA", enabled: false },
    { key: "ai_triage", label: "AI Incident Triage (Beta)", enabled: false },
  ],
  starter: [
    { key: "audit_trail", label: "Full Audit Trail", enabled: false },
    { key: "sso", label: "SSO / SAML", enabled: false },
    { key: "api_access", label: "API Access", enabled: true },
    { key: "evidence_export", label: "Evidence Pack Export", enabled: false },
    { key: "custom_policies", label: "Custom Policies", enabled: false },
    { key: "dedicated_support", label: "Dedicated Support", enabled: false },
    { key: "sla_99_9", label: "99.9% SLA", enabled: false },
    { key: "ai_triage", label: "AI Incident Triage (Beta)", enabled: false },
  ],
};

export function EntitlementsList({ plan }: EntitlementsListProps) {
  const entitlements = PLAN_ENTITLEMENTS[plan] ?? PLAN_ENTITLEMENTS.starter;

  return (
    <Card>
      <CardHeader
        title="Feature Entitlements"
        description={`Entitlements for the ${plan} plan`}
      />
      <CardContent>
        <div className="divide-y divide-[#384656]">
          {entitlements.map((item) => (
            <div key={item.key} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                {item.enabled ? (
                  <CheckCircle2 className="h-4 w-4 text-[#66FCF1]" />
                ) : (
                  <XCircle className="h-4 w-4 text-[#384656]" />
                )}
                <span className={`text-sm ${item.enabled ? "text-[#C5C6C7]" : "text-[#C5C6C7] opacity-40"}`}>
                  {item.label}
                </span>
                {item.override && (
                  <span className="rounded border border-orange-400 px-1 py-0.5 font-mono text-xs text-orange-400">
                    OVERRIDE
                  </span>
                )}
              </div>
              <div>
                {item.enabled ? (
                  <ToggleRight className="h-5 w-5 text-[#66FCF1]" />
                ) : (
                  <ToggleLeft className="h-5 w-5 text-[#384656]" />
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
