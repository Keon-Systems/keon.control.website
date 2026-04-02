"use client";

import * as React from "react";
import { Card, CardHeader, CardContent } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Users, Calendar, Layers } from "lucide-react";

interface SubscriptionData {
  tenantId: string;
  plan: string;
  status: string;
  mrr: number;
  seats: number;
  usedSeats: number;
  billingCycleAnchor: number;
  trialEndDate: string | null;
  createdAt: string;
}

interface SubscriptionPanelProps {
  data: SubscriptionData;
}

function planVariant(plan: string): "healthy" | "warning" | "default" {
  switch (plan) {
    case "enterprise": return "healthy";
    case "business": return "warning";
    default: return "default";
  }
}

function statusVariant(status: string): "healthy" | "warning" | "critical" | "default" {
  switch (status) {
    case "active": return "healthy";
    case "trial": return "warning";
    case "suspended": return "critical";
    default: return "default";
  }
}

export function SubscriptionPanel({ data }: SubscriptionPanelProps) {
  const seatPct = data.seats > 0 ? Math.round((data.usedSeats / data.seats) * 100) : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader
          title="Plan & Billing"
          actions={<Badge variant={planVariant(data.plan)} className="uppercase">{data.plan}</Badge>}
        />
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#C5C6C7] opacity-60">
                <Layers className="h-3.5 w-3.5" /> Plan
              </span>
              <span className="font-mono text-[#C5C6C7] capitalize">{data.plan}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#C5C6C7] opacity-60">
                <CreditCard className="h-3.5 w-3.5" /> MRR
              </span>
              <span className="font-mono text-[#66FCF1]">${data.mrr.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#C5C6C7] opacity-60">
                <Calendar className="h-3.5 w-3.5" /> Billing anchor
              </span>
              <span className="font-mono text-[#C5C6C7]">Day {data.billingCycleAnchor}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#C5C6C7] opacity-60">Status</span>
              <Badge variant={statusVariant(data.status)} className="uppercase">{data.status}</Badge>
            </div>
            {data.trialEndDate && (
              <div className="flex items-center justify-between">
                <span className="text-[#C5C6C7] opacity-60">Trial ends</span>
                <span className="font-mono text-[#C5C6C7]">
                  {new Date(data.trialEndDate).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-[#C5C6C7] opacity-60">Member since</span>
              <span className="font-mono text-[#C5C6C7]">
                {new Date(data.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Seat Utilization"
          actions={
            <span className="font-mono text-sm text-[#C5C6C7] opacity-60">
              {data.usedSeats}/{data.seats}
            </span>
          }
        />
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-[#66FCF1]" />
              <div className="flex-1">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-[#C5C6C7] opacity-60">Used seats</span>
                  <span className="font-mono text-[#C5C6C7]">{seatPct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-sm bg-[#384656]">
                  <div
                    className={`h-full rounded-sm transition-all ${
                      seatPct >= 90 ? "bg-red-500" : seatPct >= 70 ? "bg-orange-400" : "bg-[#66FCF1]"
                    }`}
                    style={{ width: `${seatPct}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded border border-[#384656] p-3 text-center">
                <div className="font-mono text-2xl font-bold text-[#C5C6C7]">{data.usedSeats}</div>
                <div className="text-xs text-[#C5C6C7] opacity-60">Active</div>
              </div>
              <div className="rounded border border-[#384656] p-3 text-center">
                <div className="font-mono text-2xl font-bold text-[#C5C6C7]">{data.seats - data.usedSeats}</div>
                <div className="text-xs text-[#C5C6C7] opacity-60">Available</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
