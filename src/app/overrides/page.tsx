"use client";
import * as React from "react";
import { PageContainer, PageHeader, Card, CardHeader, CardContent } from "@/components/layout/page-container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ShieldAlert } from "lucide-react";

type TargetType = "feature_flag" | "rate_limit" | "entitlement" | "quota" | "billing";

interface OverrideReceipt {
  receiptId: string;
  overrideId: string;
  tenantId: string;
  targetType: string;
  targetId: string;
  appliedValue: unknown;
  previousValue?: unknown;
  appliedBy: string;
  appliedAt: string;
  expiresAt?: string;
  rationale: string;
  status: "active" | "expired" | "revoked";
}

export default function OverridesPage() {
  const [tenantId, setTenantId] = React.useState("");
  const [targetType, setTargetType] = React.useState<TargetType>("feature_flag");
  const [targetId, setTargetId] = React.useState("");
  const [requestedValue, setRequestedValue] = React.useState("");
  const [rationale, setRationale] = React.useState("");
  const [expiresAt, setExpiresAt] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [receipt, setReceipt] = React.useState<OverrideReceipt | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const targetTypes: TargetType[] = [
    "feature_flag",
    "rate_limit",
    "entitlement",
    "quota",
    "billing",
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (rationale.trim().length < 10) {
      setError("Rationale must be at least 10 characters");
      return;
    }

    setSubmitting(true);

    // Mock receipt — no live API in Phase 1
    setTimeout(() => {
      const mockReceipt: OverrideReceipt = {
        receiptId: `OVR-RCP-${Date.now()}`,
        overrideId: `OVR-${Date.now()}`,
        tenantId,
        targetType,
        targetId,
        appliedValue: requestedValue,
        previousValue: null,
        appliedBy: "ops-hardcoded@keon.systems",
        appliedAt: new Date().toISOString(),
        expiresAt: expiresAt || undefined,
        rationale,
        status: "active",
      };
      setReceipt(mockReceipt);
      setSubmitting(false);
    }, 600);
  }

  function handleReset() {
    setReceipt(null);
    setTenantId("");
    setTargetType("feature_flag");
    setTargetId("");
    setRequestedValue("");
    setRationale("");
    setExpiresAt("");
    setError(null);
  }

  return (
    <PageContainer>
      <PageHeader
        title="Overrides"
        description="Apply targeted governance overrides for specific tenants"
      />

      {receipt ? (
        <div className="max-w-2xl">
          <Card>
            <CardHeader
              title={
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-[#66FCF1]" />
                  <span>Override Applied</span>
                </div>
              }
              description="Override receipt — keep for audit trail"
            />
            <CardContent>
              <div className="space-y-3 font-mono text-sm">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#C5C6C7] opacity-50">Receipt ID</p>
                    <p className="text-[#66FCF1]">{receipt.receiptId}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#C5C6C7] opacity-50">Override ID</p>
                    <p className="text-[#C5C6C7]">{receipt.overrideId}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#C5C6C7] opacity-50">Tenant</p>
                    <p className="text-[#C5C6C7]">{receipt.tenantId}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#C5C6C7] opacity-50">Target Type</p>
                    <Badge variant="neutral">{receipt.targetType}</Badge>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#C5C6C7] opacity-50">Target ID</p>
                    <p className="text-[#C5C6C7]">{receipt.targetId}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#C5C6C7] opacity-50">Applied Value</p>
                    <p className="text-[#C5C6C7]">{String(receipt.appliedValue)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#C5C6C7] opacity-50">Applied By</p>
                    <p className="text-[#C5C6C7]">{receipt.appliedBy}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#C5C6C7] opacity-50">Applied At</p>
                    <p className="text-[#C5C6C7]">{new Date(receipt.appliedAt).toLocaleString()}</p>
                  </div>
                  {receipt.expiresAt && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#C5C6C7] opacity-50">Expires At</p>
                      <p className="text-[#C5C6C7]">{new Date(receipt.expiresAt).toLocaleString()}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-xs uppercase tracking-wide text-[#C5C6C7] opacity-50">Rationale</p>
                    <p className="text-[#C5C6C7]">{receipt.rationale}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#C5C6C7] opacity-50">Status</p>
                    <Badge variant="healthy">{receipt.status}</Badge>
                  </div>
                </div>
                <div className="pt-2">
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    Submit Another Override
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="max-w-2xl">
          <Card>
            <CardHeader
              title={
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-[#66FCF1]" />
                  <span>Submit Override Request</span>
                </div>
              }
              description="All overrides are logged and require rationale"
            />
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">
                    Tenant ID
                  </label>
                  <Input
                    value={tenantId}
                    onChange={(e) => setTenantId(e.target.value)}
                    placeholder="tenant-acme"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">
                    Target Type
                  </label>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value as TargetType)}
                    className="flex w-full px-3 py-2 bg-[#0B0C10] text-[#C5C6C7] font-mono text-sm border border-[#384656] rounded-none focus:outline-none focus:border-[#66FCF1]"
                  >
                    {targetTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">
                    Target ID
                  </label>
                  <Input
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    placeholder="flag-ai-assist"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">
                    Requested Value
                  </label>
                  <Input
                    value={requestedValue}
                    onChange={(e) => setRequestedValue(e.target.value)}
                    placeholder="true / 100 / enabled"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">
                    Rationale (min 10 characters)
                  </label>
                  <textarea
                    value={rationale}
                    onChange={(e) => setRationale(e.target.value)}
                    placeholder="Explain why this override is necessary..."
                    required
                    rows={3}
                    className="flex w-full px-3 py-2 bg-[#0B0C10] text-[#C5C6C7] font-mono text-sm border border-[#384656] rounded-none focus:outline-none focus:border-[#66FCF1] resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">
                    Expires At (optional)
                  </label>
                  <Input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </div>
                {error && (
                  <p className="font-mono text-xs text-red-400">{error}</p>
                )}
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Applying..." : "Apply Override"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
