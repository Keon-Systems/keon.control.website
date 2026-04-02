"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";

interface ChurnRiskBadgeProps {
  score: number;
  className?: string;
}

function churnRiskLevel(score: number): {
  label: string;
  variant: "healthy" | "warning" | "critical" | "default";
} {
  if (score >= 0.7) return { label: "HIGH RISK", variant: "critical" };
  if (score >= 0.4) return { label: "MEDIUM RISK", variant: "warning" };
  return { label: "LOW RISK", variant: "healthy" };
}

export function ChurnRiskBadge({ score, className }: ChurnRiskBadgeProps) {
  const { label, variant } = churnRiskLevel(score);
  return (
    <div className={className}>
      <Badge variant={variant}>{label}</Badge>
      <span className="ml-2 font-mono text-xs text-[#C5C6C7] opacity-60">
        {Math.round(score * 100)}%
      </span>
    </div>
  );
}
