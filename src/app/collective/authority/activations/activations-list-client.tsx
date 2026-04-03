"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AuthorityActivationListItem } from "@/lib/collective/dto";
import { collectiveObservabilityQueryKeys } from "@/lib/collective/queryKeys";
import { createAuthorityActivationRepository } from "@/lib/collective/repositories";
import { toneToVariant } from "@/lib/collective/ui-bridge";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import * as React from "react";

const repo = createAuthorityActivationRepository();

const LIFECYCLE_STATUSES = [
  "Draft",
  "Pending",
  "Eligible",
  "Active",
  "Ineligible",
  "Suspended",
  "Expired",
  "Revoked",
  "Rejected",
] as const;

function ActivationCard({ item }: { readonly item: AuthorityActivationListItem }) {
  const lifecycleVariant = toneToVariant(item.lifecyclePresentation.tone);

  return (
    <Link
      href={`/collective/authority/activations/${encodeURIComponent(item.activationId)}`}
      className="block rounded border border-[#384656] bg-[#0B0C10] p-4 transition-colors hover:border-[#66FCF1]/30"
    >
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant={lifecycleVariant}>
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
          <span className="text-[#C5C6C7]/50">Agent</span>
          <p className="truncate font-mono text-[11px] text-[#C5C6C7]">{item.agentId}</p>
        </div>
        <div>
          <span className="text-[#C5C6C7]/50">Delegation</span>
          <p className="truncate font-mono text-[11px] text-[#C5C6C7]">
            <Link
              href={`/collective/authority/delegations/${encodeURIComponent(item.delegationGrantId)}`}
              className="text-[#66FCF1]/70 hover:text-[#66FCF1] transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {item.delegationGrantId}
            </Link>
          </p>
        </div>
        <div>
          <span className="text-[#C5C6C7]/50">Permission</span>
          <p className="truncate font-mono text-[11px] text-[#C5C6C7]">
            <Link
              href={`/collective/authority/permissions/${encodeURIComponent(item.permissionGrantId)}`}
              className="text-[#66FCF1]/70 hover:text-[#66FCF1] transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {item.permissionGrantId}
            </Link>
          </p>
        </div>
        <div>
          <span className="text-[#C5C6C7]/50">Requested</span>
          <p className="font-mono text-[11px] text-[#C5C6C7]">
            {new Date(item.requestedAtUtc).toLocaleString()}
          </p>
        </div>
      </div>
    </Link>
  );
}

export function ActivationsListClient() {
  const [filters, setFilters] = React.useState<Record<string, string | undefined>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: collectiveObservabilityQueryKeys.authorityActivations.list(filters),
    queryFn: () => repo.list(filters),
  });

  return (
    <div className="space-y-4 p-6">
      {/* Lifecycle status filters */}
      <div className="flex flex-wrap gap-2">
        {LIFECYCLE_STATUSES.map((label) => {
          const value = label as string;
          const isActive = filters.lifecycleState === value;
          return (
            <button
              key={label}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  lifecycleState: isActive ? undefined : value,
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
        <p className="text-[#C5C6C7]/50">Loading authority activations...</p>
      )}
      {error && (
        <p className="text-red-500">Failed to load authority activations</p>
      )}
      {data && data.length === 0 && (
        <p className="text-[#C5C6C7]/50">No authority activations observed</p>
      )}
      {data && data.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {data.map((item) => (
            <ActivationCard key={item.activationId} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
