"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, Mail, Webhook } from "lucide-react";
import { formatPercent } from "@/lib/format";

export interface DeliveryChannel {
  channel: "email" | "webhook";
  successRate: number;
  bounceCount: number;
  retryQueueDepth: number;
  last24hSent: number;
}

interface DeliveryHealthPanelProps {
  channels: DeliveryChannel[];
}

const channelIcons: Record<DeliveryChannel["channel"], React.ReactNode> = {
  email: <Mail className="h-5 w-5" />,
  webhook: <Webhook className="h-5 w-5" />,
};

const channelLabels: Record<DeliveryChannel["channel"], string> = {
  email: "Email",
  webhook: "Webhook",
};

export function DeliveryHealthPanel({ channels }: DeliveryHealthPanelProps) {
  if (channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 opacity-50">
        <p className="font-mono text-sm text-[#C5C6C7]">No delivery channel data available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {channels.map((ch) => {
        const isWarning = ch.successRate < 95;
        const barColor = isWarning ? "bg-amber-400" : "bg-[#45A29E]";
        const borderColor = isWarning ? "border-amber-400/40" : "border-[#384656]";

        return (
          <div
            key={ch.channel}
            className={cn(
              "rounded border bg-[#1F2833] p-5",
              borderColor
            )}
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded",
                    isWarning ? "bg-amber-400/10 text-amber-400" : "bg-[#66FCF1]/10 text-[#66FCF1]"
                  )}
                >
                  {channelIcons[ch.channel]}
                </div>
                <span className="font-mono text-sm font-medium text-[#C5C6C7]">
                  {channelLabels[ch.channel]}
                </span>
              </div>
              {isWarning && (
                <div className="flex items-center gap-1 rounded border border-amber-400/40 bg-amber-400/10 px-2 py-1">
                  <AlertTriangle className="h-3 w-3 text-amber-400" />
                  <span className="font-mono text-[10px] uppercase text-amber-400">Warning</span>
                </div>
              )}
            </div>

            {/* Success Rate Bar */}
            <div className="mb-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[#C5C6C7] opacity-60">Success Rate</span>
                <span
                  className={cn(
                    "font-mono text-sm tabular-nums font-medium",
                    isWarning ? "text-amber-400" : "text-[#45A29E]"
                  )}
                >
                  {formatPercent(ch.successRate)}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#384656]">
                <div
                  className={cn("h-full rounded-full transition-all", barColor)}
                  style={{ width: `${Math.max(0, Math.min(100, ch.successRate))}%` }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1 text-center">
                <div className="font-mono text-lg font-bold tabular-nums text-[#C5C6C7]">
                  {ch.last24hSent.toLocaleString()}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-[#C5C6C7] opacity-50">
                  Sent 24h
                </div>
              </div>
              <div className="space-y-1 text-center">
                <div
                  className={cn(
                    "font-mono text-lg font-bold tabular-nums",
                    ch.bounceCount > 0 ? "text-amber-400" : "text-[#C5C6C7]"
                  )}
                >
                  {ch.bounceCount}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-[#C5C6C7] opacity-50">
                  Bounces
                </div>
              </div>
              <div className="space-y-1 text-center">
                <div
                  className={cn(
                    "font-mono text-lg font-bold tabular-nums",
                    ch.retryQueueDepth > 10 ? "text-red-400" : ch.retryQueueDepth > 5 ? "text-amber-400" : "text-[#C5C6C7]"
                  )}
                >
                  {ch.retryQueueDepth}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-[#C5C6C7] opacity-50">
                  Retry Queue
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
