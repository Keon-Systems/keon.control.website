"use client";
import * as React from "react";
import { formatCurrency } from "@/lib/format";
import { Card, CardHeader, CardContent } from "@/components/layout/page-container";
import { TrendingUp, Users, DollarSign, UserCheck } from "lucide-react";

interface MrrSummary {
  mrr: number;
  arr: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  newMrr30d?: number;
  churned30d?: number;
  expansionMrr30d?: number;
  contractionMrr30d?: number;
}

interface BillingSummaryProps {
  summary: MrrSummary;
}

export function BillingSummary({ summary }: BillingSummaryProps) {
  const stats = [
    {
      label: "MRR",
      value: formatCurrency(summary.mrr),
      icon: DollarSign,
      description: "Monthly Recurring Revenue",
    },
    {
      label: "ARR",
      value: formatCurrency(summary.arr),
      icon: TrendingUp,
      description: "Annual Recurring Revenue",
    },
    {
      label: "Active Subscriptions",
      value: String(summary.activeSubscriptions),
      icon: UserCheck,
      description: "Paying customers",
    },
    {
      label: "Trial Subscriptions",
      value: String(summary.trialSubscriptions),
      icon: Users,
      description: "In trial period",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardHeader
              title={
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-[#66FCF1]" />
                  <span className="font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-70">
                    {stat.label}
                  </span>
                </div>
              }
            />
            <CardContent>
              <p className="font-mono text-2xl font-bold text-[#66FCF1]">{stat.value}</p>
              <p className="font-mono text-xs text-[#C5C6C7] opacity-50 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
