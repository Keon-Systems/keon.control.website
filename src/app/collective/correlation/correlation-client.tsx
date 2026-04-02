"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Input, Panel, PanelContent, PanelHeader } from "@/components/ui";
import { cn } from "@/lib/utils";

type LineageNode = {
  kind: "decision" | "execution" | "evidence" | "receipts";
  label: string;
  id: string;
  href: string | null;
  detail?: string;
};

type LineageEdge = {
  label: string;
};

type CorrelationResult = {
  correlationId: string;
  nodes: LineageNode[];
  edges: LineageEdge[];
};

const MOCK_CORRELATIONS: Record<string, CorrelationResult> = {
  "run-alpha-001": {
    correlationId: "run-alpha-001",
    nodes: [
      {
        kind: "decision",
        label: "Decision Case",
        id: "case-alpha-001",
        href: "/collective/decisions/case-alpha-001",
        detail: "Risk threshold evaluation",
      },
      {
        kind: "execution",
        label: "Run",
        id: "run-alpha-001",
        href: "/collective/executions/run-alpha-001",
        detail: "COMPLETED",
      },
      {
        kind: "evidence",
        label: "Evidence Pack",
        id: "evp-alpha-001",
        href: "/collective/evidence/run-alpha-001",
        detail: "SEALED",
      },
      {
        kind: "receipts",
        label: "Receipts",
        id: "4",
        href: "/collective/receipts?runId=run-alpha-001",
        detail: "4 receipts in chain",
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
        detail: "Data retention review",
      },
      {
        kind: "execution",
        label: "Run",
        id: "run-beta-002",
        href: "/collective/executions/run-beta-002",
        detail: "SEALED",
      },
      {
        kind: "evidence",
        label: "Evidence Pack",
        id: "evp-beta-002",
        href: null,
        detail: undefined,
      },
      {
        kind: "receipts",
        label: "Receipts",
        id: "2",
        href: "/collective/receipts?runId=run-beta-002",
        detail: "2 receipts in chain",
      },
    ],
    edges: [
      { label: "decision" },
      { label: "execution" },
      { label: "sealed" },
    ],
  },
};

function LineageChain({ result }: { result: CorrelationResult }) {
  return (
    <div className="space-y-0">
      {result.nodes.map((node, idx) => (
        <div key={node.kind}>
          {/* Node */}
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center w-6 pt-1">
              <div
                className={cn(
                  "w-3 h-3 rounded-full border-2",
                  node.href
                    ? "border-[--reactor-blue] bg-[--reactor-blue]/20 shadow-[0_0_4px_rgba(69,162,158,0.4)]"
                    : "border-[--tungsten] bg-transparent"
                )}
              />
            </div>
            <div className="flex-1 py-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wide text-[--tungsten]">
                  {node.label}
                </span>
                {node.href ? (
                  <Link
                    href={node.href}
                    className="font-mono text-sm text-[--reactor-blue] hover:underline"
                  >
                    [{node.id}]
                  </Link>
                ) : (
                  <span className="font-mono text-sm text-[--tungsten]">
                    lineage unavailable
                  </span>
                )}
              </div>
              {node.detail && (
                <p className="font-mono text-xs text-[--steel] mt-0.5">{node.detail}</p>
              )}
            </div>
          </div>

          {/* Edge (if not last node) */}
          {idx < result.nodes.length - 1 && (
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center w-6">
                <div className="w-px h-6 bg-[--tungsten]/50" />
              </div>
              <span className="font-mono text-[10px] text-[--tungsten] uppercase tracking-wide">
                &#8595; {result.edges[idx]?.label}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function CorrelationExplorerClient() {
  const [query, setQuery] = useState("");
  const [searchedId, setSearchedId] = useState("");

  const result = searchedId ? MOCK_CORRELATIONS[searchedId] ?? null : null;

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      setSearchedId(query.trim());
    }
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="font-mono text-lg uppercase tracking-wider text-[--flash]">
        Correlation Explorer
      </h1>

      {/* Search */}
      <Panel noise>
        <PanelHeader>Search by Correlation ID</PanelHeader>
        <PanelContent>
          <div className="flex items-center gap-3">
            <Input
              type="text"
              placeholder="Enter run ID or case ID (e.g. run-alpha-001)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <p className="text-[10px] font-mono text-[--tungsten] whitespace-nowrap">
              PRESS ENTER TO SEARCH
            </p>
          </div>
        </PanelContent>
      </Panel>

      {/* Empty state */}
      {!searchedId && (
        <Panel noise>
          <PanelContent>
            <p className="font-mono text-sm text-[--steel] text-center py-8">
              Enter a run ID or case ID to explore the governance lineage chain
            </p>
          </PanelContent>
        </Panel>
      )}

      {/* Not found */}
      {searchedId && !result && (
        <Panel noise>
          <PanelContent>
            <p className="font-mono text-sm text-[--steel] text-center py-8">
              No correlation found for: {searchedId}
            </p>
          </PanelContent>
        </Panel>
      )}

      {/* Results */}
      {result && (
        <Panel notch noise>
          <PanelHeader>
            <span className="font-mono text-sm uppercase tracking-wider text-[--flash]">
              Lineage Chain
            </span>
            <Badge variant="healthy">CORRELATED</Badge>
          </PanelHeader>
          <PanelContent>
            <LineageChain result={result} />
          </PanelContent>
        </Panel>
      )}
    </div>
  );
}
