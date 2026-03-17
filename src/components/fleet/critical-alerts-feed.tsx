"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Bell } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  severity: string;
  message: string;
  timestamp: string;
  subsystem: string;
}

interface GovernanceEnvelope {
  data: Alert[];
}

const severityStyles: Record<string, string> = {
  critical: "text-red-400",
  warning: "text-amber-400",
  info: "text-[#66FCF1]",
};

function timeAgo(ts: string): string {
  const ms = Date.now() - new Date(ts).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
}

export function CriticalAlertsFeed() {
  const { data, isLoading, error } = useQuery<GovernanceEnvelope>({
    queryKey: ["alerts", "fleet"],
    queryFn: async () => {
      const res = await fetch("/api/alerts");
      if (!res.ok) throw new Error("Failed to fetch alerts");
      return res.json();
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const criticalAlerts =
    data?.data?.filter((a) => a.severity === "critical" || a.severity === "warning") ?? [];

  return (
    <div className="flex flex-col rounded border border-[#384656] bg-[#1F2833]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#384656] px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-[#66FCF1]" />
          <span className="font-mono text-sm font-medium text-[#C5C6C7]">Critical Alerts</span>
        </div>
        {criticalAlerts.length > 0 && (
          <span className="rounded bg-red-500/20 px-2 py-0.5 font-mono text-xs text-red-400">
            {criticalAlerts.length}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 divide-y divide-[#384656]">
        {isLoading && (
          <div className="space-y-2 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-[#384656]" />
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="font-mono text-xs">Failed to load alerts</span>
          </div>
        )}

        {!isLoading && !error && criticalAlerts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Bell className="mb-2 h-6 w-6 text-[#384656]" />
            <p className="font-mono text-sm text-[#C5C6C7] opacity-50">No critical alerts</p>
          </div>
        )}

        {criticalAlerts.slice(0, 6).map((alert) => (
          <div key={alert.id} className="px-4 py-2.5">
            <div className="flex items-start justify-between gap-2">
              <p
                className={cn(
                  "flex-1 font-mono text-xs leading-relaxed",
                  severityStyles[alert.severity] ?? "text-[#C5C6C7]"
                )}
              >
                {alert.message}
              </p>
              <span className="shrink-0 font-mono text-xs text-[#C5C6C7] opacity-40">
                {timeAgo(alert.timestamp)}
              </span>
            </div>
            <p className="mt-0.5 font-mono text-xs text-[#C5C6C7] opacity-40">
              {alert.subsystem}
            </p>
          </div>
        ))}
      </div>

      {criticalAlerts.length > 6 && (
        <div className="border-t border-[#384656] px-4 py-2">
          <Link
            href="/alerts"
            className="font-mono text-xs text-[#66FCF1] hover:underline"
          >
            +{criticalAlerts.length - 6} more →
          </Link>
        </div>
      )}
    </div>
  );
}
