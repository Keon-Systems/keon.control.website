"use client";
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
    <div className="overflow-x-auto rounded border border-[#384656]">
      <table className="w-full min-w-[780px] font-mono text-sm">
        <thead>
          <tr className="border-b border-[#384656]">
            <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wide">Flag</th>
            <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wide">Description</th>
            <th className="px-4 py-3 text-center text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wide">State</th>
            <th className="px-4 py-3 text-center text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wide">Rollout %</th>
            <th className="px-4 py-3 text-center text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wide">Overrides</th>
          </tr>
        </thead>
        <tbody>
          {flags.map((flag) => (
            <tr key={flag.flagId} className="border-b border-[#384656]/40 hover:bg-[#1F2833]/50">
              <td className="px-4 py-3.5 text-[13px] text-[#66FCF1] sm:text-sm">{flag.name}</td>
              <td className="max-w-[320px] px-4 py-3.5 text-[13px] leading-[1.6] text-[#C5C6C7] opacity-70 break-words sm:text-sm">
                {flag.description ?? "—"}
              </td>
              <td className="px-4 py-3.5 text-center">
                <div
                  className={`inline-block h-6 w-10 rounded-full ${
                    flag.enabled ? "bg-[#66FCF1]" : "bg-[#384656]"
                  } relative`}
                  title={flag.enabled ? "Enabled" : "Disabled"}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-[#0B0C10] transition-transform ${
                      flag.enabled ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </div>
              </td>
              <td className="px-4 py-3.5 text-center text-[13px] text-[#C5C6C7] sm:text-sm">
                {flag.rolloutPercentage !== undefined ? `${flag.rolloutPercentage}%` : "—"}
              </td>
              <td className="px-4 py-3.5 text-center">
                {(flag.tenantOverrides?.length ?? 0) > 0 ? (
                  <Badge variant="warning">{flag.tenantOverrides!.length}</Badge>
                ) : (
                  <span className="text-[12px] text-[#C5C6C7] opacity-40 sm:text-xs">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
