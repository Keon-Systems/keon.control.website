"use client";

/**
 * Time Sync — UTC clock + ledger freshness indicator.
 * Shows whether the operator is seeing live or historical data.
 * Freshness is explicit, not implied.
 */

import type { DataFreshness } from "@/lib/cockpit/types";
import { useTimeContext } from "@/lib/cockpit/use-focus";
import { useEffect, useState } from "react";
import type { LedgerFreshnessData } from "./use-horizon-data";

const SYNC_COLORS: Record<string, string> = {
  synced: "text-[#66FCF1]",
  lagging: "text-amber-400",
  stale: "text-[#E94560]",
};

const FRESHNESS_COLORS: Record<string, string> = {
  fresh: "text-[#66FCF1]/40",
  stale: "text-amber-400",
  unknown: "text-[#C5C6C7]/20",
};

interface TimeSyncProps {
  ledgerFreshness: LedgerFreshnessData;
  freshness: DataFreshness;
}

export function TimeSync({ ledgerFreshness, freshness }: TimeSyncProps) {
  const { isLive, isHistorical, timeContext } = useTimeContext();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const utcTime = now.toISOString().slice(11, 19);

  return (
    <div className="flex items-center gap-2 shrink-0">
      {/* Live/Historical indicator */}
      <div className="flex items-center gap-1">
        <div
          className={`h-1 w-1 rounded-full ${
            isLive ? "bg-[#66FCF1] animate-pulse" : "bg-amber-400"
          }`}
        />
        <span className="text-[9px] font-mono text-[#C5C6C7]/40">
          {isLive ? "LIVE" : "HIST"}
        </span>
      </div>

      {/* UTC Clock */}
      <span className="text-[10px] font-mono tabular-nums text-[#C5C6C7]/50">
        {isHistorical && timeContext.timestamp
          ? timeContext.timestamp.slice(11, 19)
          : utcTime}
      </span>

      {/* Ledger sync status */}
      <span
        className={`text-[8px] font-mono ${SYNC_COLORS[ledgerFreshness.syncStatus]}`}
        title={`Ledger: ${ledgerFreshness.syncStatus} (${ledgerFreshness.latencyMs}ms)`}
      >
        {ledgerFreshness.latencyMs}ms
      </span>

      {/* Data freshness indicator */}
      <span
        className={`text-[8px] font-mono ${FRESHNESS_COLORS[freshness.state]}`}
        title={`Data: ${freshness.state} (last: ${freshness.lastUpdated})`}
      >
        {freshness.state === "stale" ? "⚠ STALE" : ""}
        {freshness.state === "unknown" ? "? UNKNOWN" : ""}
      </span>
    </div>
  );
}

