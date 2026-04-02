"use client";
import * as React from "react";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle } from "lucide-react";

interface BudgetAlert {
  alertId: string;
  budgetName?: string;
  severity: string;
  currentSpendUsd?: number;
  budgetAmountUsd?: number;
  percentUsed?: number;
  triggeredAt?: string;
  period?: string;
}

interface SpendAlertsListProps {
  alerts: BudgetAlert[];
}

export function SpendAlertsList({ alerts }: SpendAlertsListProps) {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 opacity-50">
        <AlertCircle className="mb-2 h-8 w-8 text-[#C5C6C7]" />
        <p className="font-mono text-sm text-[#C5C6C7]">No budget alerts</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.alertId}
          className="flex items-start gap-3 rounded border border-[#384656] bg-[#1F2833] p-4"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#FF6B00]" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-medium text-[#C5C6C7]">
                {alert.budgetName ?? alert.alertId}
              </span>
              <Badge variant={alert.severity === "critical" ? "critical" : "warning"}>
                {alert.severity}
              </Badge>
            </div>
            {alert.currentSpendUsd !== undefined && alert.budgetAmountUsd !== undefined && (
              <p className="font-mono text-xs text-[#C5C6C7] opacity-70">
                {formatCurrency(alert.currentSpendUsd)} of {formatCurrency(alert.budgetAmountUsd)}
                {alert.percentUsed !== undefined && ` (${formatPercent(alert.percentUsed)} used)`}
              </p>
            )}
            {alert.triggeredAt && (
              <p className="font-mono text-xs text-[#C5C6C7] opacity-40">
                Triggered {new Date(alert.triggeredAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
