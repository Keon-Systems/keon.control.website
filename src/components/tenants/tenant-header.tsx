"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";

interface TenantHeaderProps {
  tenantId: string;
  displayName: string;
  plan: string;
  status: string;
  mrr: number;
  healthScore: number;
}

function statusVariant(status: string): "healthy" | "warning" | "critical" | "default" {
  switch (status) {
    case "active": return "healthy";
    case "trial": return "warning";
    case "suspended": return "critical";
    default: return "default";
  }
}

function planVariant(plan: string): "healthy" | "warning" | "default" {
  switch (plan) {
    case "enterprise": return "healthy";
    case "business": return "warning";
    default: return "default";
  }
}

export function TenantHeader({ tenantId, displayName, plan, status, mrr, healthScore }: TenantHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded border border-[#384656] bg-[#1F2833]">
          <Building2 className="h-5 w-5 text-[#66FCF1]" />
        </div>
        <div>
          <h1 className="font-['Rajdhani'] text-3xl font-bold tracking-tight text-[#C5C6C7]">
            {displayName}
          </h1>
          <span className="font-mono text-xs text-[#C5C6C7] opacity-50">{tenantId}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={planVariant(plan)} className="uppercase">{plan}</Badge>
        <Badge variant={statusVariant(status)} className="uppercase">{status}</Badge>
        <div className="ml-4 text-right">
          <div className="font-mono text-lg font-semibold text-[#66FCF1]">
            ${mrr.toLocaleString()}<span className="text-xs text-[#C5C6C7] opacity-60">/mo</span>
          </div>
          <div className="font-mono text-xs text-[#C5C6C7] opacity-60">
            Health {Math.round(healthScore * 100)}%
          </div>
        </div>
      </div>
    </div>
  );
}
