"use client";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

interface TenantOverride {
  tenantId: string;
  enabled?: boolean;
  value?: boolean;
}

interface FeatureFlag {
  flagId: string;
  name: string;
  description?: string;
  enabled: boolean;
  rolloutPercentage?: number;
  tenantOverrides?: TenantOverride[];
}

interface FeatureFlagsTableProps {
  flags: FeatureFlag[];
}

export function FeatureFlagsTable({ flags }: FeatureFlagsTableProps) {
  if (flags.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 opacity-50">
        <AlertCircle className="mb-2 h-8 w-8 text-[#C5C6C7]" />
        <p className="font-mono text-sm text-[#C5C6C7]">No feature flags configured</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full font-mono text-sm">
        <thead>
          <tr className="border-b border-[#384656]">
            <th className="pb-2 text-left text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Flag</th>
            <th className="pb-2 text-left text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Description</th>
            <th className="pb-2 text-center text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">State</th>
            <th className="pb-2 text-center text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Rollout %</th>
            <th className="pb-2 text-center text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Overrides</th>
          </tr>
        </thead>
        <tbody>
          {flags.map((flag) => (
            <tr key={flag.flagId} className="border-b border-[#384656]/40 hover:bg-[#1F2833]/50">
              <td className="py-3 text-[#66FCF1]">{flag.name}</td>
              <td className="py-3 text-[#C5C6C7] opacity-70 max-w-xs truncate">
                {flag.description ?? "—"}
              </td>
              <td className="py-3 text-center">
                <div
                  className={`inline-block h-5 w-9 rounded-full ${
                    flag.enabled ? "bg-[#66FCF1]" : "bg-[#384656]"
                  } relative`}
                  title={flag.enabled ? "Enabled" : "Disabled"}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-[#0B0C10] transition-transform ${
                      flag.enabled ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </div>
              </td>
              <td className="py-3 text-center text-[#C5C6C7]">
                {flag.rolloutPercentage !== undefined ? `${flag.rolloutPercentage}%` : "—"}
              </td>
              <td className="py-3 text-center">
                {(flag.tenantOverrides?.length ?? 0) > 0 ? (
                  <Badge variant="warning">{flag.tenantOverrides!.length}</Badge>
                ) : (
                  <span className="text-[#C5C6C7] opacity-40">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
