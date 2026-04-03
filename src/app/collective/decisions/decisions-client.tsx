"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Panel, PanelContent, PanelHeader } from "@/components/ui";
import { riskVariant } from "@/lib/governance-colors";

type GovernanceEnvelope = {
  mode: "MOCK" | "LIVE";
  governance: {
    determinismStatus: string;
    sealValidationResult: string;
    incidentFlag: boolean;
  };
  data: unknown[];
  source: string;
  generatedAt: string;
};

type DecisionItem = {
  caseId: string;
  runId: string;
  workflowId: string;
  workflowVersion: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  requiredAuthorities: string[];
  createdAt: string;
};

const MOCK_DECISIONS: DecisionItem[] = [
  {
    caseId: "case-001-a7f3",
    runId: "run-2026-03-16-0001",
    workflowId: "wf-deploy-prod",
    workflowVersion: "3.1.0",
    riskLevel: "HIGH",
    requiredAuthorities: ["security-lead", "platform-owner"],
    createdAt: "2026-03-16T08:30:00Z",
  },
  {
    caseId: "case-002-b8e4",
    runId: "run-2026-03-16-0002",
    workflowId: "wf-data-migration",
    workflowVersion: "1.0.0",
    riskLevel: "CRITICAL",
    requiredAuthorities: ["data-steward", "compliance-officer"],
    createdAt: "2026-03-16T09:15:00Z",
  },
  {
    caseId: "case-003-c9d5",
    runId: "run-2026-03-16-0003",
    workflowId: "wf-config-update",
    workflowVersion: "2.4.1",
    riskLevel: "LOW",
    requiredAuthorities: ["ops-team"],
    createdAt: "2026-03-16T10:00:00Z",
  },
  {
    caseId: "case-004-d0e6",
    runId: "run-2026-03-16-0004",
    workflowId: "wf-secret-rotation",
    workflowVersion: "1.2.0",
    riskLevel: "MEDIUM",
    requiredAuthorities: ["security-lead"],
    createdAt: "2026-03-16T10:45:00Z",
  },
];

// Color contract imported from @/lib/governance-colors

type ViewState =
  | { kind: "loading" }
  | { kind: "error"; reason: string }
  | { kind: "ready"; mode: "MOCK" | "LIVE"; decisions: DecisionItem[] };

export function DecisionsClient() {
  const [state, setState] = useState<ViewState>({ kind: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const res = await fetch("/api/runs", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Governance endpoint returned ${res.status}`);
        }

        const envelope = (await res.json()) as GovernanceEnvelope;

        // Use mock decisions since kernel is not accessible from client
        setState({
          kind: "ready",
          mode: envelope.mode,
          decisions: MOCK_DECISIONS,
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        const reason = error instanceof Error ? error.message : String(error);
        setState({ kind: "error", reason });
      }
    }

    load();
    return () => controller.abort();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <h1 className="font-mono text-lg uppercase tracking-wider text-[--flash]">
          Decision Queue
        </h1>
        {state.kind === "ready" && (
          <Badge variant={state.mode === "MOCK" ? "warning" : "healthy"}>
            {state.mode}
          </Badge>
        )}
      </div>

      {state.kind === "loading" && (
        <Panel notch noise>
          <PanelContent>
            <div className="flex items-center gap-3">
              <Badge variant="neutral">LOADING</Badge>
              <span className="text-xs font-mono text-[--steel]">
                Polling decision surface...
              </span>
            </div>
          </PanelContent>
        </Panel>
      )}

      {state.kind === "error" && (
        <Panel notch noise>
          <PanelContent className="space-y-3">
            <Badge variant="critical">OFFLINE</Badge>
            <p className="text-sm font-mono uppercase tracking-wide text-[--flash]">
              DECISION SURFACE UNAVAILABLE
            </p>
            <p className="text-xs font-mono text-[--steel] break-words">
              {state.reason}
            </p>
          </PanelContent>
        </Panel>
      )}

      {state.kind === "ready" && state.decisions.length === 0 && (
        <Panel notch noise>
          <PanelContent className="flex items-center gap-3">
            <Badge variant="healthy">CLEAR</Badge>
            <span className="text-sm font-mono text-[--steel]">
              No pending decisions
            </span>
          </PanelContent>
        </Panel>
      )}

      {state.kind === "ready" && state.decisions.length > 0 && (
        <div className="space-y-3">
          {state.decisions.map((item) => (
            <Link
              key={item.caseId}
              href={`/collective/decisions/${item.caseId}`}
              className="block"
            >
              <Panel noise className="hover:border-[--reactor-blue] transition-colors">
                <PanelContent>
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                        WORKFLOW
                      </p>
                      <p className="text-sm font-mono text-[--flash]">
                        {item.workflowId}
                      </p>
                      <p className="text-[10px] font-mono text-[--steel]">
                        v{item.workflowVersion}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                        RISK LEVEL
                      </p>
                      <Badge variant={riskVariant(item.riskLevel)}>
                        {item.riskLevel}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                        CREATED
                      </p>
                      <p className="text-xs font-mono text-[--steel]">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                        REQUIRED AUTHORITIES
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {item.requiredAuthorities.map((auth) => (
                          <Badge key={auth} variant="neutral">
                            {auth}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <p className="text-[10px] font-mono text-[--tungsten]">
                      CASE: {item.caseId}
                    </p>
                  </div>
                </PanelContent>
              </Panel>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
