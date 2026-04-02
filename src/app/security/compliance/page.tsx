"use client";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { SecurityGateBanner, CompliancePosturePanel } from "@/components/security";
import { AlertCircle } from "lucide-react";

interface ComplianceCheck {
  checkId: string;
  name: string;
  category: string;
  status: "passing" | "warning" | "failing";
  lastCheckedAt: string;
  description?: string;
}

type GovernanceEnvelope = { data: Record<string, unknown>[] };

export default function SecurityCompliancePage() {
  const { data, isLoading, error } = useQuery<GovernanceEnvelope>({
    queryKey: ["security", "compliance"],
    queryFn: async () => {
      const res = await fetch("/api/security/compliance");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    staleTime: 300_000,
  });

  const checks = (data?.data ?? []) as unknown as ComplianceCheck[];

  return (
    <PageContainer>
      <PageHeader
        title="Compliance Posture"
        description="SOC2, ISO 27001, GDPR and regulatory compliance checks"
      />
      <SecurityGateBanner>
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded border border-[#384656] bg-[#1F2833]" />
            ))}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="font-mono text-sm">Failed to load compliance data</span>
          </div>
        )}
        {!isLoading && !error && <CompliancePosturePanel checks={checks} />}
      </SecurityGateBanner>
    </PageContainer>
  );
}
