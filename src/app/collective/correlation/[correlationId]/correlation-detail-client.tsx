"use client";

import Link from "next/link";
import { Badge, Panel, PanelContent, PanelHeader } from "@/components/ui";
import { cn } from "@/lib/utils";

type DetailNode = {
  kind: "decision" | "execution" | "evidence" | "receipts";
  label: string;
  id: string;
  href: string | null;
  summary: Record<string, string>;
};

type DetailEdge = {
  label: string;
};

type CorrelationDetail = {
  correlationId: string;
  nodes: DetailNode[];
  edges: DetailEdge[];
};

const MOCK_DETAILS: Record<string, CorrelationDetail> = {
  "run-alpha-001": {
    correlationId: "run-alpha-001",
    nodes: [
      {
        kind: "decision",
        label: "Decision Case",
        id: "case-alpha-001",
        href: "/collective/decisions/case-alpha-001",
        summary: {
          "Case ID": "case-alpha-001",
          Status: "APPROVED",
          "Created At": "2026-03-14T10:28:00Z",
          "Policy": "pol-risk-threshold-001",
        },
      },
      {
        kind: "execution",
        label: "Run",
        id: "run-alpha-001",
        href: "/collective/executions/run-alpha-001",
        summary: {
          "Run ID": "run-alpha-001",
          Status: "COMPLETED",
          Mode: "ENFORCE",
          "Started At": "2026-03-14T10:30:00Z",
        },
      },
      {
        kind: "evidence",
        label: "Evidence Pack",
        id: "evp-alpha-001",
        href: "/collective/evidence/run-alpha-001",
        summary: {
          "Pack ID": "evp-alpha-001",
          State: "SEALED",
          "Artifacts": "3",
          "Sealed At": "2026-03-14T10:30:42Z",
        },
      },
      {
        kind: "receipts",
        label: "Receipts",
        id: "4 receipts",
        href: "/collective/receipts?runId=run-alpha-001",
        summary: {
          Count: "4",
          "First": "2026-03-14T10:30:00Z",
          "Last": "2026-03-14T10:30:42Z",
          "Chain": "INTACT",
        },
      },
    ],
    edges: [
      { label: "decision" },
      { label: "execution" },
      { label: "sealed" },
    ],
  },
  "case-beta-002": {
    correlationId: "case-beta-002",
    nodes: [
      {
        kind: "decision",
        label: "Decision Case",
        id: "case-beta-002",
        href: "/collective/decisions/case-beta-002",
        summary: {
          "Case ID": "case-beta-002",
          Status: "APPROVED",
          "Created At": "2026-03-13T14:12:00Z",
          "Policy": "pol-data-retention-002",
        },
      },
      {
        kind: "execution",
        label: "Run",
        id: "run-beta-002",
        href: "/collective/executions/run-beta-002",
        summary: {
          "Run ID": "run-beta-002",
          Status: "SEALED",
          Mode: "AUDIT_ONLY",
          "Started At": "2026-03-13T14:15:00Z",
        },
      },
      {
        kind: "evidence",
        label: "Evidence Pack",
        id: "evp-beta-002",
        href: null,
        summary: {
          State: "UNAVAILABLE",
        },
      },
      {
        kind: "receipts",
        label: "Receipts",
        id: "2 receipts",
        href: "/collective/receipts?runId=run-beta-002",
        summary: {
          Count: "2",
          "First": "2026-03-13T14:15:00Z",
          "Last": "2026-03-13T14:15:18Z",
          "Chain": "INTACT",
        },
      },
    ],
    edges: [
      { label: "decision" },
      { label: "execution" },
      { label: "sealed" },
    ],
  },
};

function kindBadgeVariant(kind: string) {
  switch (kind) {
    case "decision":
      return "warning" as const;
    case "execution":
      return "healthy" as const;
    case "evidence":
      return "neutral" as const;
    case "receipts":
      return "healthy" as const;
    default:
      return "neutral" as const;
  }
}

export function CorrelationDetailClient({ correlationId }: { correlationId: string }) {
  const detail = MOCK_DETAILS[correlationId];

  if (!detail) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="font-mono text-lg uppercase tracking-wider text-[--flash]">
          Correlation Not Found
        </h1>
        <Panel notch noise>
          <PanelContent>
            <p className="font-mono text-sm text-[--steel]">
              No correlation found for: {correlationId}
            </p>
            <Link
              href="/collective/correlation"
              className="font-mono text-sm text-[--reactor-blue] hover:underline mt-2 inline-block"
            >
              Back to explorer
            </Link>
          </PanelContent>
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/collective/correlation"
          className="font-mono text-xs text-[--steel] hover:text-[--reactor-blue]"
        >
          CORRELATION
        </Link>
        <span className="font-mono text-xs text-[--tungsten]">/</span>
        <h1 className="font-mono text-lg uppercase tracking-wider text-[--flash]">
          {detail.correlationId}
        </h1>
      </div>

      {/* Lineage chain with detailed panels */}
      <div className="space-y-0">
        {detail.nodes.map((node, idx) => (
          <div key={node.kind}>
            {/* Node Panel */}
            <div className="flex gap-4">
              {/* Vertical connector */}
              <div className="flex flex-col items-center w-8 shrink-0">
                <div
                  className={cn(
                    "w-3 h-3 rounded-full border-2 mt-5",
                    node.href
                      ? "border-[--reactor-blue] bg-[--reactor-blue]/20 shadow-[0_0_6px_rgba(69,162,158,0.4)]"
                      : "border-[--tungsten] bg-transparent"
                  )}
                />
                {idx < detail.nodes.length - 1 && (
                  <div className="w-px flex-1 bg-[--tungsten]/40" />
                )}
              </div>

              {/* Panel content */}
              <div className="flex-1 pb-4">
                <Panel noise className="w-full">
                  <PanelHeader>
                    <div className="flex items-center gap-2">
                      <Badge variant={kindBadgeVariant(node.kind)}>
                        {node.label.toUpperCase()}
                      </Badge>
                      {node.href ? (
                        <Link
                          href={node.href}
                          className="font-mono text-sm text-[--reactor-blue] hover:underline"
                        >
                          {node.id}
                        </Link>
                      ) : (
                        <span className="font-mono text-sm text-[--tungsten]">
                          lineage unavailable
                        </span>
                      )}
                    </div>
                  </PanelHeader>
                  <PanelContent>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      {Object.entries(node.summary).map(([key, value]) => (
                        <div key={key} className="space-y-0.5">
                          <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                            {key}
                          </p>
                          <p className="font-mono text-xs text-[--steel]">{value}</p>
                        </div>
                      ))}
                    </div>
                  </PanelContent>
                </Panel>
              </div>
            </div>

            {/* Edge label */}
            {idx < detail.nodes.length - 1 && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center w-8 shrink-0">
                  <div className="w-px h-4 bg-[--tungsten]/40" />
                </div>
                <span className="font-mono text-[10px] text-[--tungsten] uppercase tracking-wide py-1">
                  &#8595; {detail.edges[idx]?.label}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
