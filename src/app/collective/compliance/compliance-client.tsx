"use client";

import Link from "next/link";
import { Badge, Panel, PanelContent, PanelHeader } from "@/components/ui";

type LegalHold = {
  holdId: string;
  tenantId: string;
  reason: string;
  createdAt: string;
  status: "ACTIVE" | "RELEASED";
};

type AuditCase = {
  caseId: string;
  tenantId: string;
  status: string;
  createdAt: string;
  evidencePackIds: string[];
};

type ComplianceSummary = {
  legalHolds: LegalHold[];
  auditCases: AuditCase[];
};

const MOCK_DATA: ComplianceSummary = {
  legalHolds: [
    {
      holdId: "hold-001",
      tenantId: "tenant-acme",
      reason: "Regulatory investigation - Q1 2026 audit",
      createdAt: "2026-02-15T08:00:00Z",
      status: "ACTIVE",
    },
    {
      holdId: "hold-002",
      tenantId: "tenant-globex",
      reason: "Compliance review - data retention",
      createdAt: "2026-01-20T12:00:00Z",
      status: "RELEASED",
    },
    {
      holdId: "hold-003",
      tenantId: "tenant-acme",
      reason: "Incident investigation - unauthorized access attempt",
      createdAt: "2026-03-10T16:30:00Z",
      status: "ACTIVE",
    },
  ],
  auditCases: [
    {
      caseId: "audit-001",
      tenantId: "tenant-acme",
      status: "OPEN",
      createdAt: "2026-03-01T09:00:00Z",
      evidencePackIds: ["evp-alpha-001", "evp-alpha-002"],
    },
    {
      caseId: "audit-002",
      tenantId: "tenant-globex",
      status: "CLOSED",
      createdAt: "2026-02-10T14:00:00Z",
      evidencePackIds: ["evp-beta-001"],
    },
    {
      caseId: "audit-003",
      tenantId: "tenant-initech",
      status: "OPEN",
      createdAt: "2026-03-12T11:00:00Z",
      evidencePackIds: [],
    },
  ],
};

function holdStatusVariant(status: "ACTIVE" | "RELEASED") {
  return status === "ACTIVE" ? "warning" : "healthy";
}

function caseStatusVariant(status: string) {
  switch (status) {
    case "OPEN":
      return "warning" as const;
    case "CLOSED":
      return "healthy" as const;
    default:
      return "neutral" as const;
  }
}

export function ComplianceClient() {
  const { legalHolds, auditCases } = MOCK_DATA;

  return (
    <div className="space-y-6 p-6">
      <h1 className="font-mono text-lg uppercase tracking-wider text-[--flash]">
        Compliance Overview
      </h1>

      {/* Legal Holds */}
      <Panel notch noise>
        <PanelHeader>
          <span className="font-mono text-sm uppercase tracking-wider text-[--flash]">
            Legal Holds
          </span>
          <Badge variant="neutral">{legalHolds.length}</Badge>
        </PanelHeader>
        <PanelContent className="p-0">
          {legalHolds.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-mono text-sm text-[--steel]">No legal holds on record</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full font-mono text-sm">
                <thead>
                  <tr className="border-b border-[--tungsten]">
                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wide text-[--tungsten]">
                      Hold ID
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wide text-[--tungsten]">
                      Tenant
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wide text-[--tungsten]">
                      Reason
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wide text-[--tungsten]">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wide text-[--tungsten]">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {legalHolds.map((hold) => (
                    <tr
                      key={hold.holdId}
                      className="border-b border-[--tungsten]/30 hover:bg-[--tungsten]/10 transition-colors"
                    >
                      <td className="px-4 py-3 text-[--flash]">{hold.holdId}</td>
                      <td className="px-4 py-3 text-[--steel]">{hold.tenantId}</td>
                      <td className="px-4 py-3 text-[--steel] max-w-xs truncate">
                        {hold.reason}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={holdStatusVariant(hold.status)}>
                          {hold.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[--steel]">
                        {new Date(hold.createdAt).toISOString().slice(0, 19).replace("T", " ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PanelContent>
      </Panel>

      {/* Audit Cases */}
      <Panel notch noise>
        <PanelHeader>
          <span className="font-mono text-sm uppercase tracking-wider text-[--flash]">
            Audit Cases
          </span>
          <Badge variant="neutral">{auditCases.length}</Badge>
        </PanelHeader>
        <PanelContent className="p-0">
          {auditCases.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-mono text-sm text-[--steel]">No audit cases on record</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full font-mono text-sm">
                <thead>
                  <tr className="border-b border-[--tungsten]">
                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wide text-[--tungsten]">
                      Case ID
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wide text-[--tungsten]">
                      Tenant
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wide text-[--tungsten]">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wide text-[--tungsten]">
                      Created
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wide text-[--tungsten]">
                      Evidence
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {auditCases.map((ac) => (
                    <tr
                      key={ac.caseId}
                      className="border-b border-[--tungsten]/30 hover:bg-[--tungsten]/10 transition-colors"
                    >
                      <td className="px-4 py-3 text-[--flash]">{ac.caseId}</td>
                      <td className="px-4 py-3 text-[--steel]">{ac.tenantId}</td>
                      <td className="px-4 py-3">
                        <Badge variant={caseStatusVariant(ac.status)}>
                          {ac.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[--steel]">
                        {new Date(ac.createdAt).toISOString().slice(0, 19).replace("T", " ")}
                      </td>
                      <td className="px-4 py-3">
                        {ac.evidencePackIds.length > 0 ? (
                          <Link
                            href={`/collective/evidence/${ac.caseId}`}
                            className="text-[--reactor-blue] hover:underline"
                          >
                            {ac.evidencePackIds.length} pack{ac.evidencePackIds.length !== 1 ? "s" : ""}
                          </Link>
                        ) : (
                          <span className="text-[--tungsten]">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PanelContent>
      </Panel>
    </div>
  );
}
