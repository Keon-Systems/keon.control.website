"use client";
import { Badge } from "@/components/ui/badge";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { formatCurrency } from "@/lib/format";
import { AlertCircle } from "lucide-react";

interface AzureResource {
  resourceId: string;
  name: string;
  type: string;
  resourceGroup: string;
  location: string;
  status: string;
  monthlyCost?: number;
  monthlyCostUsd?: number;
}

interface ResourceInventoryTableProps {
  resources: AzureResource[];
}

function statusToIndicator(status: string): "online" | "warning" | "critical" | "offline" {
  if (status === "healthy") return "online";
  if (status === "degraded") return "warning";
  if (status === "critical") return "critical";
  return "offline";
}

export function ResourceInventoryTable({ resources }: ResourceInventoryTableProps) {
  if (resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 opacity-50">
        <AlertCircle className="mb-2 h-8 w-8 text-[#C5C6C7]" />
        <p className="font-mono text-sm text-[#C5C6C7]">No resources found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded border border-[#384656]">
      <table className="w-full min-w-[880px] font-mono text-sm">
        <thead>
          <tr className="border-b border-[#384656]">
            <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wide">Name</th>
            <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wide">Type</th>
            <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wide">Resource Group</th>
            <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wide">Location</th>
            <th className="px-4 py-3 text-center text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wide">Status</th>
            <th className="px-4 py-3 text-right text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wide">Monthly Cost</th>
          </tr>
        </thead>
        <tbody>
          {resources.map((resource) => {
            const cost = resource.monthlyCost ?? resource.monthlyCostUsd ?? 0;
            return (
              <tr key={resource.resourceId} className="border-b border-[#384656]/40 hover:bg-[#1F2833]/50">
                <td className="px-4 py-3.5 text-[13px] text-[#66FCF1] sm:text-sm">{resource.name}</td>
                <td className="px-4 py-3.5">
                  <Badge variant="neutral">{resource.type}</Badge>
                </td>
                <td className="px-4 py-3.5 text-[13px] text-[#C5C6C7] sm:text-sm">{resource.resourceGroup}</td>
                <td className="px-4 py-3.5 text-[13px] text-[#C5C6C7] opacity-70 sm:text-sm">{resource.location}</td>
                <td className="px-4 py-3.5 text-center">
                  <StatusIndicator
                    status={statusToIndicator(resource.status)}
                    label={resource.status}
                  />
                </td>
                <td className="px-4 py-3.5 text-right text-[13px] text-[#C5C6C7] sm:text-sm">
                  {cost > 0 ? formatCurrency(cost) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
