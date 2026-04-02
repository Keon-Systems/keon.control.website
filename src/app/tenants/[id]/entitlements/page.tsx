"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { EntitlementsList } from "@/components/tenants/entitlements-list";
import { Loader2 } from "lucide-react";

interface TenantDetailData {
  tenantId: string;
  plan: string;
}

export default function TenantEntitlementsPage() {
  const params = useParams<{ id: string }>();
  const tenantId = params.id;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["tenant-detail", tenantId],
    queryFn: async () => {
      const res = await fetch(`/api/tenants/${tenantId}`);
      if (!res.ok) throw new Error("Tenant not found");
      const json = await res.json() as { data: TenantDetailData };
      return json.data;
    },
  });

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex h-48 items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[#66FCF1]" />
          <span className="font-mono text-sm text-[#C5C6C7] opacity-60">Loading entitlements…</span>
        </div>
      </PageContainer>
    );
  }

  if (isError || !data) {
    return (
      <PageContainer>
        <p className="font-mono text-sm text-red-400">Tenant data unavailable.</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <EntitlementsList tenantId={data.tenantId} plan={data.plan} />
    </PageContainer>
  );
}
