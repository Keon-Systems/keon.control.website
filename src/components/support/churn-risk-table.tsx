"use client";

import * as React from "react";
import { Card, CardHeader, CardContent } from "@/components/layout/page-container";
import { ChurnRiskBadge } from "@/components/tenants/churn-risk-badge";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import Link from "next/link";

interface ChurnRiskTenant {
  tenantId: string;
  displayName: string;
  churnRiskScore: number;
  trend: string;
  signals: string[];
  lastActiveAt: string;
}

interface ChurnRiskTableProps {
  tenants: ChurnRiskTenant[];
}

function TrendIcon({ trend }: { trend: string }) {
  switch (trend) {
    case "worsening":
      return <TrendingDown className="h-4 w-4 text-red-400" />;
    case "improving":
      return <TrendingUp className="h-4 w-4 text-[#66FCF1]" />;
    default:
      return <Minus className="h-4 w-4 text-[#C5C6C7] opacity-40" />;
  }
}

function signalLabel(signal: string): string {
  return signal.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ChurnRiskTable({ tenants }: ChurnRiskTableProps) {
  const sorted = [...tenants].sort((a, b) => b.churnRiskScore - a.churnRiskScore);

  return (
    <Card>
      <CardHeader
        title="Churn Risk"
        description={`${sorted.length} tenant${sorted.length !== 1 ? "s" : ""} flagged`}
      />
      <CardContent>
        <div className="divide-y divide-[#384656]">
          {sorted.map((tenant) => (
            <div key={tenant.tenantId} className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/tenants/${tenant.tenantId}`}
                      className="font-['Rajdhani'] text-lg font-semibold text-[#C5C6C7] hover:text-[#66FCF1] transition-colors"
                    >
                      {tenant.displayName}
                    </Link>
                    <TrendIcon trend={tenant.trend} />
                    <span className="font-mono text-xs text-[#C5C6C7] opacity-50 capitalize">
                      {tenant.trend}
                    </span>
                  </div>
                  <ChurnRiskBadge score={tenant.churnRiskScore} className="mt-1 flex items-center" />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {tenant.signals.map((signal) => (
                      <span
                        key={signal}
                        className="rounded border border-[#384656] px-1.5 py-0.5 font-mono text-xs text-[#C5C6C7] opacity-70"
                      >
                        {signalLabel(signal)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="shrink-0 text-right font-mono text-xs text-[#C5C6C7] opacity-50">
                  Last active<br />
                  {new Date(tenant.lastActiveAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
