"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Badge, Panel, PanelContent, PanelHeader } from "@/components/ui";

type Finding = {
  findingId: string;
  severity: string;
  category: string;
  location: {
    path: string;
    lineStart?: number;
    lineEnd?: number;
  };
  message: string;
  proposedAction?: {
    type: string;
    description?: string;
    patchRef?: string;
  };
};

type PolicyRef = {
  policyId: string;
  version: string;
  hash: string;
};

type CaseData = {
  caseId: string;
  runId: string;
  tenantId: string;
  status: string;
  policyContext?: {
    policyLineage: PolicyRef[];
  };
  summary?: {
    findingCount: number;
    proposedActionCount: number;
    highSeverityCount: number;
  };
  findings: Finding[];
};

function severityBadgeVariant(severity: string) {
  switch (severity.toUpperCase()) {
    case "LOW":
      return "healthy" as const;
    case "MEDIUM":
      return "neutral" as const;
    case "HIGH":
      return "warning" as const;
    case "CRITICAL":
      return "critical" as const;
    default:
      return "neutral" as const;
  }
}

function truncateHash(hash: string): string {
  if (hash.length <= 20) return hash;
  return `${hash.slice(0, 16)}...${hash.slice(-8)}`;
}

function buildMockCase(caseId: string): CaseData {
  return {
    caseId,
    runId: "run-2026-03-16-0001",
    tenantId: "tenant-keon-prod",
    status: "PENDING_REVIEW",
    policyContext: {
      policyLineage: [
        {
          policyId: "pol-security-baseline",
          version: "2.1.0",
          hash: "sha256:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
        },
        {
          policyId: "pol-deploy-guardrails",
          version: "1.3.0",
          hash: "sha256:f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5",
        },
      ],
    },
    summary: {
      findingCount: 3,
      proposedActionCount: 2,
      highSeverityCount: 1,
    },
    findings: [
      {
        findingId: "fnd-001",
        severity: "HIGH",
        category: "security",
        location: {
          path: "src/config/database.ts",
          lineStart: 42,
          lineEnd: 48,
        },
        message:
          "Connection string contains unencrypted credentials. Recommend vault reference.",
        proposedAction: {
          type: "PATCH",
          description: "Replace inline credentials with vault lookup",
          patchRef: "patch-001",
        },
      },
      {
        findingId: "fnd-002",
        severity: "MEDIUM",
        category: "compliance",
        location: {
          path: "src/services/data-export.ts",
          lineStart: 115,
        },
        message:
          "Data export endpoint missing audit logging. Required by policy pol-security-baseline v2.1.0.",
        proposedAction: {
          type: "PATCH",
          description: "Add audit log call before response",
          patchRef: "patch-002",
        },
      },
      {
        findingId: "fnd-003",
        severity: "LOW",
        category: "best-practice",
        location: {
          path: "src/utils/retry.ts",
          lineStart: 8,
          lineEnd: 12,
        },
        message:
          "Retry loop lacks exponential backoff. May cause thundering herd under load.",
      },
    ],
  };
}

export function CaseInspectorClient() {
  const params = useParams<{ caseId: string }>();
  const caseId = params.caseId;
  const caseData = buildMockCase(caseId);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="font-mono text-lg uppercase tracking-wider text-[--flash]">
          Case Inspector
        </h1>
        <Badge variant="warning">MOCK</Badge>
      </div>

      {/* Case Metadata */}
      <Panel notch noise>
        <PanelHeader>Case Header</PanelHeader>
        <PanelContent>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                CASE ID
              </p>
              <p className="text-sm font-mono text-[--flash]">
                {caseData.caseId}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                RUN ID
              </p>
              <p className="text-sm font-mono text-[--flash]">
                {caseData.runId}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                STATUS
              </p>
              <Badge variant="warning">{caseData.status}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                TENANT
              </p>
              <p className="text-sm font-mono text-[--steel]">
                {caseData.tenantId}
              </p>
            </div>
          </div>
        </PanelContent>
      </Panel>

      {/* Summary */}
      {caseData.summary && (
        <div className="grid grid-cols-3 gap-4">
          <Panel noise>
            <PanelContent>
              <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                FINDINGS
              </p>
              <p className="text-xl font-mono text-[--flash]">
                {caseData.summary.findingCount}
              </p>
            </PanelContent>
          </Panel>
          <Panel noise>
            <PanelContent>
              <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                PROPOSED ACTIONS
              </p>
              <p className="text-xl font-mono text-[--flash]">
                {caseData.summary.proposedActionCount}
              </p>
            </PanelContent>
          </Panel>
          <Panel noise>
            <PanelContent>
              <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                HIGH SEVERITY
              </p>
              <p className="text-xl font-mono text-[--flash]">
                {caseData.summary.highSeverityCount}
              </p>
            </PanelContent>
          </Panel>
        </div>
      )}

      {/* Findings */}
      <Panel notch noise>
        <PanelHeader>Findings</PanelHeader>
        <PanelContent className="space-y-4">
          {caseData.findings.map((finding) => (
            <div
              key={finding.findingId}
              className="border border-[--tungsten] rounded-sm p-4 space-y-3"
            >
              <div className="flex items-center gap-3">
                <Badge variant={severityBadgeVariant(finding.severity)}>
                  {finding.severity}
                </Badge>
                <Badge variant="neutral">{finding.category}</Badge>
                <span className="text-[10px] font-mono text-[--tungsten]">
                  {finding.findingId}
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                  LOCATION
                </p>
                <p className="text-xs font-mono text-[--reactor-blue]">
                  {finding.location.path}
                  {finding.location.lineStart != null && (
                    <span className="text-[--steel]">
                      :{finding.location.lineStart}
                      {finding.location.lineEnd != null &&
                        `-${finding.location.lineEnd}`}
                    </span>
                  )}
                </p>
              </div>

              <p className="text-sm font-mono text-[--flash]">
                {finding.message}
              </p>

              {finding.proposedAction && (
                <div className="border-t border-[--tungsten] pt-3 space-y-1">
                  <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                    PROPOSED ACTION
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="neutral">{finding.proposedAction.type}</Badge>
                    {finding.proposedAction.description && (
                      <span className="text-xs font-mono text-[--steel]">
                        {finding.proposedAction.description}
                      </span>
                    )}
                  </div>
                  {finding.proposedAction.patchRef && (
                    <p className="text-[10px] font-mono text-[--tungsten]">
                      PATCH REF: {finding.proposedAction.patchRef}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </PanelContent>
      </Panel>

      {/* Policy Context */}
      {caseData.policyContext &&
        caseData.policyContext.policyLineage.length > 0 && (
          <Panel notch noise>
            <PanelHeader>Policy Context</PanelHeader>
            <PanelContent>
              <div className="space-y-3">
                {caseData.policyContext.policyLineage.map((ref, idx) => (
                  <div
                    key={ref.policyId}
                    className="flex items-center gap-4 border border-[--tungsten] rounded-sm p-3"
                  >
                    <span className="text-[10px] font-mono text-[--tungsten]">
                      {idx + 1}
                    </span>
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-mono text-[--flash]">
                        {ref.policyId}
                      </p>
                      <div className="flex items-center gap-3">
                        <Badge variant="neutral">v{ref.version}</Badge>
                        <span
                          className="text-[10px] font-mono text-[--tungsten]"
                          title={ref.hash}
                        >
                          {truncateHash(ref.hash)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </PanelContent>
          </Panel>
        )}

      {/* Cross-Links */}
      <Panel noise>
        <PanelHeader>Related Views</PanelHeader>
        <PanelContent>
          <div className="flex items-center gap-4">
            <Link
              href={`/collective/executions/${caseData.runId}`}
              className="text-sm font-mono text-[--reactor-blue] hover:underline"
            >
              View Execution
            </Link>
            <Link
              href={`/collective/evidence/${caseData.runId}`}
              className="text-sm font-mono text-[--reactor-blue] hover:underline"
            >
              View Evidence
            </Link>
          </div>
        </PanelContent>
      </Panel>
    </div>
  );
}
