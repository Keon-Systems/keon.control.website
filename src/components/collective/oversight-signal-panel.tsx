"use client";

import { Badge } from "@/components/ui/badge";
import type { UIOversightSignal } from "@/lib/mappers/collective";
import * as React from "react";

interface OversightSignalPanelProps {
  readonly signals: UIOversightSignal[];
}

type SeverityFilter = "all" | "info" | "warning" | "error" | "critical";

export function OversightSignalPanel({ signals }: OversightSignalPanelProps) {
  const [severityFilter, setSeverityFilter] = React.useState<SeverityFilter>("all");

  const filteredSignals = React.useMemo(() => {
    if (severityFilter === "all") return signals;
    return signals.filter((s) => s.severity === severityFilter);
  }, [signals, severityFilter]);

  return (
    <div className="rounded border border-[#384656] bg-[#1F2833] p-4 font-mono">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-[--steel]">
          Oversight Signals
        </div>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
          className="bg-[#0B0C10] border border-[#384656] rounded px-3 py-1 text-xs font-mono text-[#C5C6C7] focus:border-[#66FCF1]/50 focus:outline-none"
        >
          <option value="all">All severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {filteredSignals.length === 0 ? (
        <div className="py-6 text-center text-xs text-[--steel] opacity-50">
          No signals match the current filter.
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSignals.map((signal) => (
            <div
              key={signal.id}
              className="rounded border border-[#384656] bg-[#0B0C10] p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant={signal.severityBadgeVariant}>
                      {signal.severity.toUpperCase()}
                    </Badge>
                    <span className="text-[10px] uppercase tracking-wider text-[--steel]">
                      {signal.type}
                    </span>
                    {signal.resolved && (
                      <Badge variant="neutral">RESOLVED</Badge>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed text-[#C5C6C7]">
                    {signal.description}
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-[10px] text-[--steel]">
                    <span>Source: {signal.source}</span>
                    <span>{signal.timestamp}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
