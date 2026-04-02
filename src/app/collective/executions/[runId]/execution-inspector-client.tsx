"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Badge, Panel, PanelContent, PanelHeader } from "@/components/ui";
import { statusVariant } from "@/lib/governance-colors";

type RunData = {
  runId: string;
  status: string;
  gateStatus: string;
  workflowId: string;
  workflowVersion: string;
  tenantId: string;
  createdAt: string;
  completedAt: string | null;
};

function gateBadgeVariant(gate: string) {
  switch (gate) {
    case "PASSED":
      return "healthy" as const;
    case "REQUIRED":
    case "PENDING":
      return "warning" as const;
    case "DENIED":
      return "critical" as const;
    default:
      return "neutral" as const;
  }
}

function buildMockRun(runId: string): RunData {
  return {
    runId,
    status: "GATE_REQUIRED",
    gateStatus: "PENDING",
    workflowId: "wf-deploy-prod",
    workflowVersion: "3.1.0",
    tenantId: "tenant-keon-prod",
    createdAt: "2026-03-16T08:30:00Z",
    completedAt: null,
  };
}

export function ExecutionInspectorClient() {
  const params = useParams<{ runId: string }>();
  const runId = params.runId;
  const run = buildMockRun(runId);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="font-mono text-lg uppercase tracking-wider text-[--flash]">
          Execution Inspector
        </h1>
        <Badge variant="warning">MOCK</Badge>
      </div>

      {/* Run Metadata */}
      <Panel notch noise>
        <PanelHeader>Run Metadata</PanelHeader>
        <PanelContent>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                RUN ID
              </p>
              <p className="text-sm font-mono text-[--flash]">{run.runId}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                STATUS
              </p>
              <Badge variant={statusVariant(run.status)}>
                {run.status.replace("_", " ")}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                GATE STATUS
              </p>
              <Badge variant={gateBadgeVariant(run.gateStatus)}>
                {run.gateStatus}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                WORKFLOW
              </p>
              <p className="text-sm font-mono text-[--flash]">
                {run.workflowId}
              </p>
              <p className="text-[10px] font-mono text-[--steel]">
                v{run.workflowVersion}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                TENANT
              </p>
              <p className="text-sm font-mono text-[--steel]">
                {run.tenantId}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                CREATED
              </p>
              <p className="text-xs font-mono text-[--steel]">
                {new Date(run.createdAt).toLocaleString()}
              </p>
              {run.completedAt && (
                <>
                  <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten] mt-2">
                    COMPLETED
                  </p>
                  <p className="text-xs font-mono text-[--steel]">
                    {new Date(run.completedAt).toLocaleString()}
                  </p>
                </>
              )}
            </div>
          </div>
        </PanelContent>
      </Panel>

      {/* Cross-Links */}
      <Panel noise>
        <PanelHeader>Related Views</PanelHeader>
        <PanelContent>
          <div className="flex items-center gap-4">
            <Link
              href={`/collective/evidence/${run.runId}`}
              className="text-sm font-mono text-[--reactor-blue] hover:underline"
            >
              View Evidence
            </Link>
            <Link
              href={`/collective/receipts?runId=${run.runId}`}
              className="text-sm font-mono text-[--reactor-blue] hover:underline"
            >
              View Receipts
            </Link>
          </div>
        </PanelContent>
      </Panel>
    </div>
  );
}
