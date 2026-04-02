"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";

interface SloBurnRate {
  sloId: string;
  sloName: string;
  burnRate: number;
  status: string;
  errorBudgetRemaining: number;
}

interface GovernanceEnvelope {
  data: SloBurnRate[];
}

export function SloBurnBanner() {
  const { data, isLoading } = useQuery<GovernanceEnvelope>({
    queryKey: ["slo", "burn"],
    queryFn: async () => {
      const res = await fetch("/api/observability/slo");
      if (!res.ok) throw new Error("Failed to fetch SLO data");
      return res.json();
    },
    staleTime: 30_000,
  });

  const burningSlOs = data?.data?.filter((s) => s.burnRate > 1 && s.status !== "healthy") ?? [];

  if (isLoading) {
    return (
      <div className="h-10 animate-pulse rounded border border-[#384656] bg-[#1F2833]" />
    );
  }

  if (burningSlOs.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded border border-[#384656] bg-[#1F2833] px-4 py-2.5">
        <CheckCircle className="h-4 w-4 text-[#66FCF1]" />
        <span className="font-mono text-sm text-[#C5C6C7]">
          All SLOs healthy — error budgets nominal
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded border border-amber-500/40 bg-amber-500/10 px-4 py-2.5">
      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
      <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1">
        <span className="font-mono text-sm font-medium text-amber-300">
          {burningSlOs.length} SLO{burningSlOs.length !== 1 ? "s" : ""} burning fast
        </span>
        {burningSlOs.slice(0, 3).map((slo) => (
          <span key={slo.sloId} className="font-mono text-xs text-amber-200/70">
            {slo.sloName} ×{slo.burnRate.toFixed(1)}
          </span>
        ))}
      </div>
      <Link
        href="/observability/slo"
        className="shrink-0 font-mono text-xs text-amber-400 underline hover:text-amber-300"
      >
        View SLOs →
      </Link>
    </div>
  );
}
