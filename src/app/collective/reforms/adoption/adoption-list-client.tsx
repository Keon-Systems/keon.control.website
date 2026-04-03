"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ReformAdoptionDecisionListItem, ReformAdoptionFilterState } from "@/lib/collective/dto";
import { collectiveObservabilityQueryKeys } from "@/lib/collective/queryKeys";
import { createReformAdoptionRepository } from "@/lib/collective/repositories";
import { toneToVariant } from "@/lib/collective/ui-bridge";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import * as React from "react";

const repo = createReformAdoptionRepository();

function AdoptionCard({ item }: { readonly item: ReformAdoptionDecisionListItem }) {
  const dispositionVariant = toneToVariant(item.dispositionPresentation.tone);

  return (
    <Link
      href={`/collective/reforms/adoption/${encodeURIComponent(item.decisionId)}`}
      className="block rounded border border-[#384656] bg-[#0B0C10] p-4 transition-colors hover:border-[#66FCF1]/30"
    >
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant={dispositionVariant}>
                {item.dispositionPresentation.label}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <span className="font-mono text-xs">raw: {item.dispositionPresentation.raw}</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant={toneToVariant(item.lifecyclePresentation.tone)}>
                {item.lifecyclePresentation.label}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <span className="font-mono text-xs">raw: {item.lifecyclePresentation.raw}</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div>
          <span className="text-[#C5C6C7]/50">Proposal</span>
          <p className="truncate font-mono text-[11px] text-[#C5C6C7]">{item.proposalId}</p>
        </div>
        <div>
          <span className="text-[#C5C6C7]/50">Epoch</span>
          <p className="font-mono text-[#C5C6C7]">{item.anchorEpochId}</p>
        </div>
        <div className="col-span-2">
          <span className="text-[#C5C6C7]/50">Decided</span>
          <p className="font-mono text-[11px] text-[#C5C6C7]">
            {new Date(item.decidedAtUtc).toLocaleString()}
          </p>
        </div>
      </div>

      <p className="mt-2 line-clamp-2 text-xs text-[#C5C6C7]/70">
        {item.decisionRationale}
      </p>
    </Link>
  );
}

export function AdoptionListClient() {
  const [filters, setFilters] = React.useState<ReformAdoptionFilterState>({});

  const { data, isLoading, error } = useQuery({
    queryKey: collectiveObservabilityQueryKeys.reformAdoption.list(filters),
    queryFn: () => repo.list(filters),
  });

  return (
    <div className="space-y-4 p-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(["Approved", "Rejected", "Superseded", "Revoked"] as const).map((label) => {
          const value = label as string;
          const isActive = filters.disposition === value;
          return (
            <button
              key={label}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  disposition: isActive ? undefined : (value as ReformAdoptionFilterState["disposition"]),
                }))
              }
              className={`rounded border px-3 py-1.5 font-mono text-xs transition-colors ${
                isActive
                  ? "border-[#66FCF1] bg-[#66FCF1]/10 text-[#66FCF1]"
                  : "border-[#384656] text-[#C5C6C7]/70 hover:border-[#66FCF1]/30"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {isLoading && (
        <p className="text-[#C5C6C7]/50">Loading adoption decisions...</p>
      )}
      {error && (
        <p className="text-red-500">Failed to load adoption decisions</p>
      )}
      {data && data.length === 0 && (
        <p className="text-[#C5C6C7]/50">No adoption decisions observed</p>
      )}
      {data && data.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {data.map((item) => (
            <AdoptionCard key={item.decisionId} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
