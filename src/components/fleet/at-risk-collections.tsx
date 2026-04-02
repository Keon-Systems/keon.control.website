"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, DollarSign } from "lucide-react";
import Link from "next/link";

interface CollectionItem {
  tenantId: string;
  tenantName?: string;
  invoiceId: string;
  // supports both amountCents (dollars × 100) and amount (dollars)
  amountCents?: number;
  amount?: number;
  dunningStep: number;
  status: string;
  failedAt: string;
}

interface GovernanceEnvelope {
  data: CollectionItem[];
}

function toUsd(item: CollectionItem): number {
  if (item.amountCents !== undefined) return item.amountCents / 100;
  return item.amount ?? 0;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function AtRiskCollections() {
  const { data, isLoading, error } = useQuery<GovernanceEnvelope>({
    queryKey: ["finance", "collections"],
    queryFn: async () => {
      const res = await fetch("/api/finance/collections");
      if (!res.ok) throw new Error("Failed to fetch collections");
      return res.json();
    },
    staleTime: 60_000,
  });

  const openItems = data?.data?.filter((c) => c.status === "open") ?? [];
  const totalAtRisk = openItems.reduce((sum, c) => sum + toUsd(c), 0);

  return (
    <div className="flex flex-col rounded border border-[#384656] bg-[#1F2833]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#384656] px-4 py-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-[#66FCF1]" />
          <span className="font-mono text-sm font-medium text-[#C5C6C7]">At-Risk Collections</span>
        </div>
        <Link
          href="/finance/collections"
          className="font-mono text-xs text-[#66FCF1] hover:underline"
        >
          View all →
        </Link>
      </div>

      {/* Body */}
      <div className="flex-1 divide-y divide-[#384656]">
        {isLoading && (
          <div className="space-y-2 p-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-[#384656]" />
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="font-mono text-xs">Failed to load collections</span>
          </div>
        )}

        {!isLoading && !error && openItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <DollarSign className="mb-2 h-6 w-6 text-[#384656]" />
            <p className="font-mono text-sm text-[#C5C6C7] opacity-50">No open collections</p>
          </div>
        )}

        {openItems.length > 0 && (
          <div className="px-4 py-3">
            <p className="font-mono text-2xl font-bold text-amber-400">
              {formatCurrency(totalAtRisk)}
            </p>
            <p className="font-mono text-xs text-[#C5C6C7] opacity-50">
              {openItems.length} open invoice{openItems.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {openItems.slice(0, 4).map((item) => (
          <div key={item.invoiceId} className="flex items-center justify-between px-4 py-2.5">
            <div>
              <p className="font-mono text-xs text-[#C5C6C7]">
                {item.tenantName ?? item.tenantId}
              </p>
              <p className="font-mono text-xs text-[#C5C6C7] opacity-40">
                Step {item.dunningStep} dunning
              </p>
            </div>
            <span className="font-mono text-sm font-medium text-amber-400">
              {formatCurrency(toUsd(item))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
