"use client";
import * as React from "react";
import { formatCurrency } from "@/lib/format";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { AlertCircle } from "lucide-react";

interface ResourceGroupHealth {
  resourceGroup: string;
  region?: string;
  status: string;
  resourceCount?: number;
  unhealthyCount?: number;
  totalMonthlyCostUsd?: number;
  lastCheckedAt?: string;
}

interface HealthStatusGridProps {
  groups: ResourceGroupHealth[];
}

function statusToIndicator(status: string): "online" | "warning" | "critical" | "offline" {
  if (status === "healthy") return "online";
  if (status === "degraded") return "warning";
  if (status === "critical") return "critical";
  return "offline";
}

export function HealthStatusGrid({ groups }: HealthStatusGridProps) {
  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 opacity-50">
        <AlertCircle className="mb-2 h-8 w-8 text-[#C5C6C7]" />
        <p className="font-mono text-sm text-[#C5C6C7]">No resource groups found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <div
          key={group.resourceGroup}
          className="rounded border border-[#384656] bg-[#1F2833] p-4 space-y-3"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-sm font-medium text-[#C5C6C7]">{group.resourceGroup}</p>
              {group.region && (
                <p className="font-mono text-xs text-[#C5C6C7] opacity-50">{group.region}</p>
              )}
            </div>
            <StatusIndicator
              status={statusToIndicator(group.status)}
              label={group.status}
            />
          </div>
          <div className="flex gap-4 font-mono text-xs">
            {group.resourceCount !== undefined && (
              <div>
                <p className="text-[#C5C6C7] opacity-50">Resources</p>
                <p className="text-[#C5C6C7]">{group.resourceCount}</p>
              </div>
            )}
            {group.unhealthyCount !== undefined && (
              <div>
                <p className="text-[#C5C6C7] opacity-50">Unhealthy</p>
                <p className={group.unhealthyCount > 0 ? "text-[#FF6B00]" : "text-[#C5C6C7]"}>
                  {group.unhealthyCount}
                </p>
              </div>
            )}
            {group.totalMonthlyCostUsd !== undefined && (
              <div>
                <p className="text-[#C5C6C7] opacity-50">Cost/mo</p>
                <p className="text-[#C5C6C7]">{formatCurrency(group.totalMonthlyCostUsd)}</p>
              </div>
            )}
          </div>
          {group.lastCheckedAt && (
            <p className="font-mono text-xs text-[#C5C6C7] opacity-30">
              Checked {new Date(group.lastCheckedAt).toLocaleTimeString()}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
