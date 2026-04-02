"use client";

import * as React from "react";
import { Card, CardHeader, CardContent } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { ClipboardList } from "lucide-react";

interface AuditEntry {
  entryId: string;
  actorId: string;
  actorDisplay: string;
  action: string;
  target: string;
  privilegeLevel: string;
  timestamp: string;
  result: "allowed" | "denied";
}

interface TenantAuditTrailProps {
  entries: AuditEntry[];
}

const MOCK_TENANT_AUDIT: AuditEntry[] = [
  {
    entryId: "TAUDIT-001",
    actorId: "admin.jones",
    actorDisplay: "Admin Jones",
    action: "VIEW_TENANT_DETAIL",
    target: "tenant workspace",
    privilegeLevel: "ADMIN",
    timestamp: "2026-03-06T09:00:00Z",
    result: "allowed",
  },
  {
    entryId: "TAUDIT-002",
    actorId: "operator.smith",
    actorDisplay: "Operator Smith",
    action: "UPDATE_PLAN",
    target: "subscription tier",
    privilegeLevel: "OPERATOR",
    timestamp: "2026-03-05T14:00:00Z",
    result: "denied",
  },
  {
    entryId: "TAUDIT-003",
    actorId: "admin.jones",
    actorDisplay: "Admin Jones",
    action: "APPLY_OVERRIDE",
    target: "feature flag / ai_incident_triage",
    privilegeLevel: "ADMIN",
    timestamp: "2026-03-04T10:30:00Z",
    result: "allowed",
  },
];

export function TenantAuditTrail({ entries = MOCK_TENANT_AUDIT }: TenantAuditTrailProps) {
  return (
    <Card>
      <CardHeader
        title="Audit Trail"
        description="Recent operator actions for this tenant"
      />
      <CardContent>
        <div className="space-y-0 divide-y divide-[#384656]">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <ClipboardList className="h-8 w-8 text-[#384656]" />
              <p className="font-mono text-sm text-[#C5C6C7] opacity-50">No audit entries</p>
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.entryId} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-[#C5C6C7]">
                      {entry.action}
                    </span>
                    <Badge
                      variant={entry.result === "allowed" ? "healthy" : "critical"}
                      className="uppercase"
                    >
                      {entry.result}
                    </Badge>
                  </div>
                  <div className="mt-0.5 font-mono text-xs text-[#C5C6C7] opacity-60">
                    {entry.actorDisplay} &middot; {entry.target}
                  </div>
                </div>
                <div className="shrink-0 font-mono text-xs text-[#C5C6C7] opacity-40">
                  {new Date(entry.timestamp).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
