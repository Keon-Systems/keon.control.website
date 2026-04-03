"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Panel, PanelContent, PanelHeader } from "@/components/ui";
import { DeferredPanel } from "@/components/collective/deferred-panel";
import {
  statusVariant,
  constitutionalVariant,
  incidentVariant,
  CONSTITUTIONAL_TOOLTIPS,
} from "@/lib/governance-colors";
import type { RunStatus } from "@/lib/contracts/common";

type GovernanceEnvelope = {
  mode: "MOCK" | "LIVE";
  governance: {
    determinismStatus: "SEALED" | "DEGRADED" | "UNKNOWN";
    sealValidationResult: "VALID" | "INVALID" | "UNKNOWN";
    incidentFlag: boolean;
  };
  data: unknown[];
  source: string;
  generatedAt: string;
};

type RunRecord = {
  status?: string;
  [key: string]: unknown;
};

type PulseState =
  | { kind: "loading" }
  | { kind: "unavailable"; reason: string }
  | {
      kind: "ready";
      mode: "MOCK" | "LIVE";
      determinismStatus: "SEALED" | "DEGRADED" | "UNKNOWN";
      sealValidationResult: "VALID" | "INVALID" | "UNKNOWN";
      incidentFlag: boolean;
      counts: { tenants: number; policies: number; runs: number; alerts: number };
      telemetry: {
        pendingDecisions: number | null;
        runsByStatus: Record<string, number>;
        denyRate: number | null;
        gateRate: number | null;
        sealRate: number | null;
      };
      source: string;
      generatedAt: string;
    };

// Color contract now imported from @/lib/governance-colors

function computeRunTelemetry(runs: RunRecord[]) {
  const statusCounts: Record<string, number> = {};
  for (const run of runs) {
    const s = (run.status as string) || "UNKNOWN";
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }

  const total = runs.length;
  const completed = statusCounts["COMPLETED"] || 0;
  const denied = statusCounts["DENIED"] || 0;
  const failed = statusCounts["FAILED"] || 0;
  const gated = statusCounts["GATE_REQUIRED"] || 0;
  const sealed = statusCounts["SEALED"] || 0;

  const terminalTotal = completed + denied + failed;
  const denyRate = terminalTotal > 0 ? denied / terminalTotal : null;
  const gateRate = total > 0 ? gated / total : null;
  const sealRate = total > 0 ? sealed / total : null;

  return { runsByStatus: statusCounts, denyRate, gateRate, sealRate };
}

function formatRate(rate: number | null): string {
  if (rate === null) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}

const RUN_STATUS_ORDER: RunStatus[] = [
  "QUEUED",
  "RUNNING",
  "GATE_REQUIRED",
  "COMPLETED",
  "DENIED",
  "FAILED",
  "SEALED",
];

// statusVariant now imported from @/lib/governance-colors

export function PulseClient() {
  const [state, setState] = useState<PulseState>({ kind: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);

    async function load() {
      try {
        const [tenantsRes, policiesRes, runsRes, alertsRes] = await Promise.all([
          fetch("/api/tenants", { cache: "no-store", signal: controller.signal }),
          fetch("/api/policies", { cache: "no-store", signal: controller.signal }),
          fetch("/api/runs", { cache: "no-store", signal: controller.signal }),
          fetch("/api/alerts", { cache: "no-store", signal: controller.signal }),
        ]);

        if (!tenantsRes.ok || !policiesRes.ok || !runsRes.ok || !alertsRes.ok) {
          throw new Error("One or more governance endpoints returned non-success");
        }

        const [tenants, policies, runs, alerts] = (await Promise.all([
          tenantsRes.json(),
          policiesRes.json(),
          runsRes.json(),
          alertsRes.json(),
        ])) as [GovernanceEnvelope, GovernanceEnvelope, GovernanceEnvelope, GovernanceEnvelope];

        const governance = {
          determinismStatus:
            runs.governance.determinismStatus !== "UNKNOWN"
              ? runs.governance.determinismStatus
              : alerts.governance.determinismStatus,
          sealValidationResult:
            runs.governance.sealValidationResult !== "UNKNOWN"
              ? runs.governance.sealValidationResult
              : alerts.governance.sealValidationResult,
          incidentFlag: runs.governance.incidentFlag || alerts.governance.incidentFlag,
        };

        const runRecords = runs.data as RunRecord[];
        const telemetry = computeRunTelemetry(runRecords);

        setState({
          kind: "ready",
          mode: runs.mode,
          determinismStatus: governance.determinismStatus,
          sealValidationResult: governance.sealValidationResult,
          incidentFlag: governance.incidentFlag,
          counts: {
            tenants: tenants.data.length,
            policies: policies.data.length,
            runs: runs.data.length,
            alerts: alerts.data.length,
          },
          telemetry: {
            pendingDecisions: null, // Not yet derivable from governance envelope
            ...telemetry,
          },
          source: runs.source,
          generatedAt: runs.generatedAt,
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        setState({ kind: "unavailable", reason });
      } finally {
        window.clearTimeout(timeoutId);
      }
    }

    load();

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <h1 className="font-mono text-lg uppercase tracking-wider text-[--flash]">
          Governance Pulse
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
                Polling governance surfaces...
              </span>
            </div>
          </PanelContent>
        </Panel>
      )}

      {state.kind === "unavailable" && (
        <Panel notch noise>
          <PanelContent className="space-y-3">
            <Badge variant="critical">OFFLINE</Badge>
            <p className="text-sm font-mono uppercase tracking-wide text-[--flash]">
              GOVERNANCE UNAVAILABLE
            </p>
            <p className="text-xs font-mono text-[--steel] break-words">{state.reason}</p>
          </PanelContent>
        </Panel>
      )}

      {state.kind === "ready" && (
        <>
          {/* Row 1 — Constitutional Integrity Indicators (larger badges, tooltips) */}
          <Panel notch noise>
            <PanelHeader>Constitutional Integrity</PanelHeader>
            <PanelContent>
              <div className="grid grid-cols-3 gap-4">
                <div
                  className="space-y-2 cursor-help"
                  title={CONSTITUTIONAL_TOOLTIPS.DETERMINISM}
                >
                  <p className="text-xs font-mono uppercase tracking-wide text-[--tungsten]">
                    DETERMINISM
                  </p>
                  <Badge
                    variant={constitutionalVariant(state.determinismStatus)}
                    className="px-3 py-1 text-sm"
                  >
                    {state.determinismStatus}
                  </Badge>
                </div>
                <div
                  className="space-y-2 cursor-help"
                  title={CONSTITUTIONAL_TOOLTIPS.SEAL_VALIDATION}
                >
                  <p className="text-xs font-mono uppercase tracking-wide text-[--tungsten]">
                    SEAL VALIDATION
                  </p>
                  <Badge
                    variant={constitutionalVariant(state.sealValidationResult)}
                    className="px-3 py-1 text-sm"
                  >
                    {state.sealValidationResult}
                  </Badge>
                </div>
                <div
                  className="space-y-2 cursor-help"
                  title={CONSTITUTIONAL_TOOLTIPS.INCIDENT_FLAG}
                >
                  <p className="text-xs font-mono uppercase tracking-wide text-[--tungsten]">
                    INCIDENT FLAG
                  </p>
                  <Badge
                    variant={incidentVariant(state.incidentFlag)}
                    className="px-3 py-1 text-sm"
                  >
                    {state.incidentFlag ? "ACTIVE" : "CLEAR"}
                  </Badge>
                </div>
              </div>
            </PanelContent>
          </Panel>

          {/* Row 2 — Governance Health Telemetry */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Panel noise>
              <PanelHeader>Deny Rate</PanelHeader>
              <PanelContent>
                <p className="text-2xl font-mono text-[--flash]">
                  {formatRate(state.telemetry.denyRate)}
                </p>
                <p className="text-[10px] font-mono text-[--tungsten]">
                  {state.telemetry.denyRate === null ? "NO TERMINAL RUNS" : "DENIED / TERMINAL"}
                </p>
              </PanelContent>
            </Panel>

            <Panel noise>
              <PanelHeader>Gate Rate</PanelHeader>
              <PanelContent>
                <p className="text-2xl font-mono text-[--flash]">
                  {formatRate(state.telemetry.gateRate)}
                </p>
                <p className="text-[10px] font-mono text-[--tungsten]">
                  {state.telemetry.gateRate === null ? "NO RUNS" : "GATE_REQUIRED / TOTAL"}
                </p>
              </PanelContent>
            </Panel>

            <Panel noise>
              <PanelHeader>Seal Rate</PanelHeader>
              <PanelContent>
                <p className="text-2xl font-mono text-[--flash]">
                  {formatRate(state.telemetry.sealRate)}
                </p>
                <p className="text-[10px] font-mono text-[--tungsten]">
                  {state.telemetry.sealRate === null ? "NO RUNS" : "SEALED / TOTAL"}
                </p>
              </PanelContent>
            </Panel>

            <Panel noise>
              <PanelHeader>Pending Decisions</PanelHeader>
              <PanelContent>
                <p className="text-2xl font-mono text-[--flash]">
                  {state.telemetry.pendingDecisions ?? "—"}
                </p>
                <p className="text-[10px] font-mono text-[--tungsten]">
                  {state.telemetry.pendingDecisions === null
                    ? "AWAITING DECISION SURFACE"
                    : "REQUIRING REVIEW"}
                </p>
                <Link
                  href="/collective/correlation"
                  className="mt-2 inline-block text-[10px] font-mono text-[--reactor-blue] hover:underline"
                >
                  View correlation traces &rarr;
                </Link>
              </PanelContent>
            </Panel>
          </div>

          {/* Row 3 — Execution Status Distribution */}
          <Panel noise>
            <PanelHeader>Execution Status Distribution</PanelHeader>
            <PanelContent>
              <div className="grid grid-cols-4 gap-3 lg:grid-cols-7">
                {RUN_STATUS_ORDER.map((status) => {
                  const count = state.telemetry.runsByStatus[status] || 0;
                  return (
                    <div key={status} className="space-y-1">
                      <Badge variant={statusVariant(status)}>
                        {status.replace("_", " ")}
                      </Badge>
                      <p className="text-lg font-mono text-[--flash]">{count}</p>
                    </div>
                  );
                })}
              </div>
            </PanelContent>
          </Panel>

          {/* Row 4 — Entity Counters */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {(
              [
                ["TENANTS", state.counts.tenants],
                ["POLICIES", state.counts.policies],
                ["RUNS", state.counts.runs],
                ["ALERTS", state.counts.alerts],
              ] as const
            ).map(([label, count]) => (
              <Panel key={label} noise>
                <PanelContent>
                  <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                    {label}
                  </p>
                  <p className="text-xl font-mono text-[--flash]">{count}</p>
                </PanelContent>
              </Panel>
            ))}
          </div>

          {/* Row 5 — Mode + Timestamp */}
          <div className="flex items-center justify-between text-[10px] font-mono text-[--steel]">
            <span>SOURCE: {state.source}</span>
            <span>STAMP: {state.generatedAt}</span>
          </div>

          {/* Row 6 — Deferred Future Concepts */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DeferredPanel
              title="Agent Topology"
              description="Visualize agent relationships, delegation chains, and specialization clusters."
              prerequisite="Agent metadata service with relationship graph API"
            />
            <DeferredPanel
              title="Civic Health Score"
              description="Aggregate civic reasoning quality from decision history and participation patterns."
              prerequisite="Aggregation service computing health from decision history"
            />
            <DeferredPanel
              title="Deliberation Threads"
              description="Multi-round collaborative deliberation with proposals, challenges, and synthesis."
              prerequisite="Multi-round deliberation protocol with thread API"
            />
            <DeferredPanel
              title="Constellation Graph"
              description="Force-directed visualization of reasoning artifacts and lineage topology."
              prerequisite="Graph service providing node positions and edge weights"
            />
          </div>
        </>
      )}
    </div>
  );
}
