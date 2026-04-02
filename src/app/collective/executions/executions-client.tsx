"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Panel, PanelContent, PanelHeader } from "@/components/ui";
import { statusVariant } from "@/lib/governance-colors";
import type { RunStatus } from "@/lib/contracts/common";

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

type RunRecord = {
  runId?: string;
  id?: string;
  status?: string;
  gateStatus?: string;
  workflowId?: string;
  createdAt?: string;
  [key: string]: unknown;
};

const ALL_STATUSES: RunStatus[] = [
  "QUEUED",
  "RUNNING",
  "GATE_REQUIRED",
  "COMPLETED",
  "DENIED",
  "FAILED",
  "SEALED",
];

// Color contract imported from @/lib/governance-colors

function truncateId(id: string): string {
  if (id.length <= 16) return id;
  return `${id.slice(0, 12)}...${id.slice(-4)}`;
}

type ViewState =
  | { kind: "loading" }
  | { kind: "error"; reason: string }
  | {
      kind: "ready";
      mode: "MOCK" | "LIVE";
      runs: RunRecord[];
      source: string;
      generatedAt: string;
    };

export function ExecutionBrowserClient() {
  const [state, setState] = useState<ViewState>({ kind: "loading" });
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

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
        const runs = envelope.data as RunRecord[];

        setState({
          kind: "ready",
          mode: envelope.mode,
          runs,
          source: envelope.source,
          generatedAt: envelope.generatedAt,
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

  const filteredRuns =
    state.kind === "ready"
      ? statusFilter
        ? state.runs.filter((r) => r.status === statusFilter)
        : state.runs
      : [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <h1 className="font-mono text-lg uppercase tracking-wider text-[--flash]">
          Execution Browser
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
                Polling execution surface...
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
              EXECUTION SURFACE UNAVAILABLE
            </p>
            <p className="text-xs font-mono text-[--steel] break-words">
              {state.reason}
            </p>
          </PanelContent>
        </Panel>
      )}

      {state.kind === "ready" && (
        <>
          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter(null)}
              className={`px-2 py-0.5 text-xs font-mono uppercase tracking-wide border rounded-sm transition-colors ${
                statusFilter === null
                  ? "border-[--reactor-blue] text-[--reactor-blue]"
                  : "border-[--tungsten] text-[--steel] hover:border-[--steel]"
              }`}
            >
              ALL
            </button>
            {ALL_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() =>
                  setStatusFilter(statusFilter === status ? null : status)
                }
                className={`px-2 py-0.5 text-xs font-mono uppercase tracking-wide border rounded-sm transition-colors ${
                  statusFilter === status
                    ? "border-[--reactor-blue] text-[--reactor-blue]"
                    : "border-[--tungsten] text-[--steel] hover:border-[--steel]"
                }`}
              >
                {status.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Runs Table */}
          <Panel notch noise>
            <PanelHeader>
              <span className="font-mono text-sm uppercase tracking-wider text-[--flash]">
                Runs
              </span>
              <span className="text-[10px] font-mono text-[--tungsten]">
                {filteredRuns.length} OF {state.runs.length}
              </span>
            </PanelHeader>
            <PanelContent>
              {filteredRuns.length === 0 ? (
                <p className="text-sm font-mono text-[--steel]">
                  No runs match the current filter.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[--tungsten]">
                        <th className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten] pb-2 pr-4">
                          RUN ID
                        </th>
                        <th className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten] pb-2 pr-4">
                          STATUS
                        </th>
                        <th className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten] pb-2">
                          GATE
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRuns.map((run, idx) => {
                        const runId =
                          (run.runId as string) ||
                          (run.id as string) ||
                          `run-${idx}`;
                        const status = (run.status as string) || "UNKNOWN";
                        const isGated = status === "GATE_REQUIRED";

                        return (
                          <tr
                            key={runId}
                            className="border-b border-[--tungsten] last:border-b-0"
                          >
                            <td className="py-2 pr-4">
                              <Link
                                href={`/collective/executions/${runId}`}
                                className="text-sm font-mono text-[--reactor-blue] hover:underline"
                                title={runId}
                              >
                                {truncateId(runId)}
                              </Link>
                            </td>
                            <td className="py-2 pr-4">
                              <Badge variant={statusVariant(status)}>
                                {status.replace("_", " ")}
                              </Badge>
                            </td>
                            <td className="py-2">
                              {isGated && (
                                <Badge variant="warning" title="Gate Required">
                                  GATED
                                </Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </PanelContent>
          </Panel>

          {/* Footer */}
          <div className="flex items-center justify-between text-[10px] font-mono text-[--steel]">
            <span>SOURCE: {state.source}</span>
            <span>STAMP: {state.generatedAt}</span>
          </div>
        </>
      )}
    </div>
  );
}
