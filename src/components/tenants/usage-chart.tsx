"use client";

import * as React from "react";
import { Card, CardHeader, CardContent } from "@/components/layout/page-container";
import { HardDrive, Zap, Users } from "lucide-react";

interface UsageData {
  tenantId: string;
  storage: { usedGb: number; quotaGb: number; percentUsed: number };
  apiCalls: { used: number; quota: number; percentUsed: number };
  seats: { used: number; total: number; percentUsed: number };
}

interface UsageChartProps {
  data: UsageData;
}

interface QuotaBarProps {
  label: string;
  icon: React.ReactNode;
  used: number | string;
  total: number | string;
  unit: string;
  percent: number;
}

function QuotaBar({ label, icon, used, total, unit, percent }: QuotaBarProps) {
  const barColor =
    percent >= 90 ? "bg-red-500" : percent >= 70 ? "bg-orange-400" : "bg-[#66FCF1]";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-[#C5C6C7] opacity-70">
          {icon}
          {label}
        </span>
        <span className="font-mono text-[#C5C6C7]">
          {used} / {total} {unit}
          <span className="ml-2 text-[#C5C6C7] opacity-50">({percent}%)</span>
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-sm bg-[#384656]">
        <div
          className={`h-full rounded-sm transition-all ${barColor}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}

export function UsageChart({ data }: UsageChartProps) {
  const formatNumber = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n.toLocaleString();

  return (
    <Card>
      <CardHeader
        title="Quota Utilization"
        description="Current period usage against plan limits"
      />
      <CardContent>
        <div className="space-y-6">
          <QuotaBar
            label="Storage"
            icon={<HardDrive className="h-4 w-4" />}
            used={data.storage.usedGb}
            total={data.storage.quotaGb}
            unit="GB"
            percent={data.storage.percentUsed}
          />
          <QuotaBar
            label="API Calls"
            icon={<Zap className="h-4 w-4" />}
            used={formatNumber(data.apiCalls.used)}
            total={formatNumber(data.apiCalls.quota)}
            unit="calls"
            percent={data.apiCalls.percentUsed}
          />
          <QuotaBar
            label="Seats"
            icon={<Users className="h-4 w-4" />}
            used={data.seats.used}
            total={data.seats.total}
            unit="seats"
            percent={data.seats.percentUsed}
          />
        </div>
      </CardContent>
    </Card>
  );
}
