"use client";
import * as React from "react";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { StatusIndicator } from "@/components/ui/status-indicator";
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
    <div className="overflow-x-auto">
      <table className="w-full font-mono text-sm">
        <thead>
          <tr className="border-b border-[#384656]">
            <th className="pb-2 text-left text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Name</th>
            <th className="pb-2 text-left text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Type</th>
            <th className="pb-2 text-left text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Resource Group</th>
            <th className="pb-2 text-left text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Location</th>
            <th className="pb-2 text-center text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Status</th>
            <th className="pb-2 text-right text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Monthly Cost</th>
          </tr>
        </thead>
        <tbody>
          {resources.map((resource) => {
            const cost = resource.monthlyCost ?? resource.monthlyCostUsd ?? 0;
            return (
              <tr key={resource.resourceId} className="border-b border-[#384656]/40 hover:bg-[#1F2833]/50">
                <td className="py-3 text-[#66FCF1]">{resource.name}</td>
                <td className="py-3">
                  <Badge variant="neutral">{resource.type}</Badge>
                </td>
                <td className="py-3 text-[#C5C6C7]">{resource.resourceGroup}</td>
                <td className="py-3 text-[#C5C6C7] opacity-70">{resource.location}</td>
                <td className="py-3 text-center">
                  <StatusIndicator
                    status={statusToIndicator(resource.status)}
                    label={resource.status}
                  />
                </td>
                <td className="py-3 text-right text-[#C5C6C7]">
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
