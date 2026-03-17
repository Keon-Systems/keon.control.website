"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardHeader, CardContent } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert } from "lucide-react";

const MOCK_SECURITY_EVENTS = [
  {
    id: "SE-001",
    type: "auth_anomaly",
    severity: "medium",
    description: "Login from unusual location",
    timestamp: "2026-03-06T05:15:00Z",
    mitigated: false,
  },
  {
    id: "SE-002",
    type: "api_abuse",
    severity: "low",
    description: "Sequential ID enumeration attempt",
    timestamp: "2026-03-05T16:30:00Z",
    mitigated: true,
  },
];

function severityVariant(severity: string): "healthy" | "warning" | "critical" | "default" {
  switch (severity) {
    case "high": case "critical": return "critical";
    case "medium": return "warning";
    default: return "default";
  }
}

export default function TenantSecurityPage() {
  const params = useParams<{ id: string }>();
  const tenantId = params.id;

  return (
    <PageContainer>
      <Card>
        <CardHeader
          title="Security Events"
          description={`Security events for tenant ${tenantId}`}
        />
        <CardContent>
          {MOCK_SECURITY_EVENTS.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <ShieldAlert className="h-8 w-8 text-[#384656]" />
              <p className="font-mono text-sm text-[#C5C6C7] opacity-50">No security events</p>
            </div>
          ) : (
            <div className="divide-y divide-[#384656]">
              {MOCK_SECURITY_EVENTS.map((event) => (
                <div key={event.id} className="flex items-start justify-between gap-4 py-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[#66FCF1]">{event.id}</span>
                      <Badge variant={severityVariant(event.severity)} className="uppercase">
                        {event.severity}
                      </Badge>
                      {event.mitigated && (
                        <Badge variant="healthy" className="uppercase">mitigated</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-[#C5C6C7]">{event.description}</p>
                    <p className="mt-0.5 font-mono text-xs text-[#C5C6C7] opacity-50 capitalize">
                      {event.type.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div className="shrink-0 font-mono text-xs text-[#C5C6C7] opacity-40">
                    {new Date(event.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
