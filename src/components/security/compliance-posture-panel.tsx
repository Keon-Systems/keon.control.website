"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, AlertTriangle, XCircle, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/layout/page-container";

interface ComplianceCheck {
  checkId: string;
  name: string;
  category: string;
  status: "passing" | "warning" | "failing";
  lastCheckedAt: string;
  description?: string;
}

interface CompliancePosturePanelProps {
  checks: ComplianceCheck[];
}

function statusIcon(status: ComplianceCheck["status"]) {
  switch (status) {
    case "passing":
      return <CheckCircle className="h-4 w-4 text-emerald-400" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-amber-400" />;
    case "failing":
      return <XCircle className="h-4 w-4 text-red-400" />;
    default:
      return null;
  }
}

function statusBadgeClass(status: ComplianceCheck["status"]): string {
  switch (status) {
    case "passing":
      return "bg-emerald-950 text-emerald-400 border border-emerald-800";
    case "warning":
      return "bg-amber-950 text-amber-400 border border-amber-800";
    case "failing":
      return "bg-red-950 text-red-400 border border-red-800";
    default:
      return "bg-[#1F2833] text-[#C5C6C7] border border-[#384656]";
  }
}

function auditReadinessIndicator(checks: ComplianceCheck[]): { label: string; cls: string } {
  const failing = checks.filter((c) => c.status === "failing").length;
  const warning = checks.filter((c) => c.status === "warning").length;
  if (failing > 0) return { label: "not-ready", cls: "text-red-400" };
  if (warning > 0) return { label: "at-risk", cls: "text-amber-400" };
  return { label: "ready", cls: "text-emerald-400" };
}

export function CompliancePosturePanel({ checks }: CompliancePosturePanelProps) {
  const total = checks.length;
  const passing = checks.filter((c) => c.status === "passing").length;
  const coverage = total > 0 ? Math.round((passing / total) * 100) : 0;
  const evidenceCompleteness = total > 0 ? Math.round(((passing + 0.5 * checks.filter((c) => c.status === "warning").length) / total) * 100) : 0;
  const readiness = auditReadinessIndicator(checks);

  const categories = Array.from(new Set(checks.map((c) => c.category)));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader
            title={
              <span className="font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-70">
                Policy Coverage
              </span>
            }
          />
          <CardContent>
            <div className="space-y-2">
              <p className="font-mono text-2xl font-bold text-[#66FCF1]">{coverage}%</p>
              <div className="h-1.5 w-full rounded-full bg-[#0B0C10] overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    coverage >= 90 ? "bg-emerald-500" : coverage >= 70 ? "bg-amber-500" : "bg-red-500"
                  )}
                  style={{ width: `${coverage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title={
              <span className="font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-70">
                Evidence Completeness
              </span>
            }
          />
          <CardContent>
            <div className="space-y-2">
              <p className="font-mono text-2xl font-bold text-[#66FCF1]">{evidenceCompleteness}%</p>
              <div className="h-1.5 w-full rounded-full bg-[#0B0C10] overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    evidenceCompleteness >= 90 ? "bg-emerald-500" : evidenceCompleteness >= 70 ? "bg-amber-500" : "bg-red-500"
                  )}
                  style={{ width: `${evidenceCompleteness}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title={
              <span className="font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-70">
                Audit Readiness
              </span>
            }
          />
          <CardContent>
            <div className="flex items-center gap-2">
              <ShieldCheck className={cn("h-6 w-6", readiness.cls)} />
              <p className={cn("font-mono text-lg font-bold", readiness.cls)}>{readiness.label}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Checks by framework */}
      {categories.map((category) => {
        const catChecks = checks.filter((c) => c.category === category);
        return (
          <div key={category} className="space-y-2">
            <h3 className="font-mono text-xs uppercase tracking-wider text-[#C5C6C7] opacity-60">
              {category.toUpperCase()}
            </h3>
            <div className="rounded border border-[#384656] overflow-hidden">
              {catChecks.map((check, idx) => (
                <div
                  key={check.checkId}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[#1F2833]",
                    idx !== catChecks.length - 1 && "border-b border-[#384656]"
                  )}
                >
                  <div className="mt-0.5 shrink-0">{statusIcon(check.status)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm text-[#C5C6C7]">{check.name}</p>
                    {check.description && (
                      <p className="font-mono text-xs text-[#C5C6C7] opacity-50 mt-0.5 truncate">{check.description}</p>
                    )}
                  </div>
                  <span className={cn("rounded px-2 py-0.5 font-mono text-xs shrink-0", statusBadgeClass(check.status))}>
                    {check.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
