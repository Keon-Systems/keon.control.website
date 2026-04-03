"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PreparedEffectRequestListItem } from "@/lib/collective/dto";
import { collectiveObservabilityQueryKeys } from "@/lib/collective/queryKeys";
import { createPreparedEffectRepository } from "@/lib/collective/repositories";
import { toneToVariant } from "@/lib/collective/ui-bridge";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import * as React from "react";

const repo = createPreparedEffectRepository();

const LIFECYCLE_FILTERS = ["Prepared", "Expired", "Terminated"] as const;

function PreparedEffectCard({ item }: { readonly item: PreparedEffectRequestListItem }) {
  return (
    <Link
      href={`/collective/effects/prepared/${encodeURIComponent(item.preparedRequestId)}`}
      className="block rounded border border-[#384656] bg-[#0B0C10] p-4 transition-colors hover:border-[#66FCF1]/30"
    >
      <div className="flex items-center gap-2">
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

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant={toneToVariant(item.dispositionPresentation.tone)}>
                {item.dispositionPresentation.label}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <span className="font-mono text-xs">raw: {item.dispositionPresentation.raw}</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Badge variant="offline">INERT</Badge>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div>
          <span className="text-[#C5C6C7]/50">Domain</span>
          <p className="truncate font-mono text-[11px] text-[#C5C6C7]">{item.domainScope}</p>
        </div>
        <div>
          <span className="text-[#C5C6C7]/50">Effect Class</span>
          <p className="truncate font-mono text-[11px] text-[#C5C6C7]">{item.effectClass}</p>
        </div>
        <div>
          <span className="text-[#C5C6C7]/50">Target Class</span>
          <p className="truncate font-mono text-[11px] text-[#C5C6C7]">{item.targetClass}</p>
        </div>
        <div>
          <span className="text-[#C5C6C7]/50">Prepared</span>
          <p className="font-mono text-[11px] text-[#C5C6C7]">
            {new Date(item.preparedAtUtc).toLocaleString()}
          </p>
        </div>
        <div className="col-span-2">
          <span className="text-[#C5C6C7]/50">Expires</span>
          <p className="font-mono text-[11px] text-[#C5C6C7]">
            {new Date(item.expiresAtUtc).toLocaleString()}
          </p>
        </div>
      </div>
    </Link>
  );
}

export function PreparedEffectsListClient() {
  const [filters, setFilters] = React.useState<Record<string, string | undefined>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: collectiveObservabilityQueryKeys.preparedEffects.list(filters),
    queryFn: () => repo.list(filters),
  });

  return (
    <div className="space-y-4 p-6">
      {/* Lifecycle status filters */}
      <div className="flex flex-wrap gap-2">
        {LIFECYCLE_FILTERS.map((label) => {
          const isActive = filters.lifecycleState === label;
          return (
            <button
              key={label}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  lifecycleState: isActive ? undefined : label,
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
        <p className="text-[#C5C6C7]/50">Loading prepared effect requests...</p>
      )}
      {error && (
        <p className="text-red-500">Failed to load prepared effect requests</p>
      )}
      {data && data.length === 0 && (
        <p className="text-[#C5C6C7]/50">No prepared effect requests observed</p>
      )}
      {data && data.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {data.map((item) => (
            <PreparedEffectCard key={item.preparedRequestId} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
