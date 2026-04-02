"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AgentPermissionGrantListItem } from "@/lib/collective/dto";
import { collectiveObservabilityQueryKeys } from "@/lib/collective/queryKeys";
import { createAgentPermissionRepository } from "@/lib/collective/repositories";
import { toneToVariant } from "@/lib/collective/ui-bridge";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import * as React from "react";

const repo = createAgentPermissionRepository();

function PermissionCard({ item }: { readonly item: AgentPermissionGrantListItem }) {
  const lifecycleVariant = toneToVariant(item.lifecyclePresentation.tone);

  return (
    <Link
      href={`/collective/authority/permissions/${encodeURIComponent(item.grantId)}`}
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
          <Link
            href={`/collective/authority/delegations/${encodeURIComponent(item.delegationGrantId)}`}
            onClick={(e) => e.stopPropagation()}
            className="block truncate font-mono text-[11px] text-[#66FCF1] hover:underline"
          >
            {item.delegationGrantId}
          </Link>
        </div>
        <div className="col-span-2">
          <span className="text-[#C5C6C7]/50">Effective</span>
          <p className="font-mono text-[11px] text-[#C5C6C7]">
            {new Date(item.effectiveFromUtc).toLocaleString()} &mdash;{" "}
            {new Date(item.expiresAtUtc).toLocaleString()}
          </p>
        </div>
      </div>
    </Link>
  );
}

export function PermissionsListClient() {
  const [filters, setFilters] = React.useState<Record<string, string | undefined>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: collectiveObservabilityQueryKeys.agentPermissions.list(filters),
    queryFn: () => repo.list(filters),
  });

  return (
    <div className="space-y-4 p-6">
      {/* Lifecycle status filters */}
      <div className="flex flex-wrap gap-2">
        {(["Active", "Expired", "Revoked", "Rejected"] as const).map((label) => {
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
        <p className="text-[#C5C6C7]/50">Loading agent permission grants...</p>
      )}
      {error && (
        <p className="text-red-500">Failed to load agent permission grants</p>
      )}
      {data && data.length === 0 && (
        <p className="text-[#C5C6C7]/50">No agent permission grants observed</p>
      )}
      {data && data.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {data.map((item) => (
            <PermissionCard key={item.grantId} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
