"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge, Input, Panel, PanelContent, PanelHeader } from "@/components/ui";

type ReceiptsSummary = {
  runId: string;
  count: number;
  firstReceiptAt?: string;
  lastReceiptAt?: string;
  receiptIds: string[];
};

const MOCK_SUMMARIES: Record<string, ReceiptsSummary> = {
  "run-alpha-001": {
    runId: "run-alpha-001",
    count: 4,
    firstReceiptAt: "2026-03-14T10:30:00Z",
    lastReceiptAt: "2026-03-14T10:30:42Z",
    receiptIds: [
      "rcpt-a001-0001",
      "rcpt-a001-0002",
      "rcpt-a001-0003",
      "rcpt-a001-0004",
    ],
  },
  "run-beta-002": {
    runId: "run-beta-002",
    count: 2,
    firstReceiptAt: "2026-03-13T14:15:00Z",
    lastReceiptAt: "2026-03-13T14:15:18Z",
    receiptIds: ["rcpt-b002-0001", "rcpt-b002-0002"],
  },
};

export function ReceiptExplorerClient() {
  const searchParams = useSearchParams();
  const initialRunId = searchParams.get("runId") ?? "";
  const [query, setQuery] = useState(initialRunId);
  const [searchedRunId, setSearchedRunId] = useState(initialRunId);

  const summary = searchedRunId ? MOCK_SUMMARIES[searchedRunId] ?? null : null;

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      setSearchedRunId(query.trim());
    }
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="font-mono text-lg uppercase tracking-wider text-[--flash]">
        Receipt Explorer
      </h1>

      {/* Search */}
      <Panel noise>
        <PanelHeader>Search by Run ID</PanelHeader>
        <PanelContent>
          <div className="flex items-center gap-3">
            <Input
              type="text"
              placeholder="Enter run ID (e.g. run-alpha-001)"
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

      {/* Results */}
      {!searchedRunId && (
        <Panel noise>
          <PanelContent>
            <p className="font-mono text-sm text-[--steel] text-center py-8">
              Enter a Run ID above to explore receipts
            </p>
          </PanelContent>
        </Panel>
      )}

      {searchedRunId && !summary && (
        <Panel noise>
          <PanelContent>
            <p className="font-mono text-sm text-[--steel] text-center py-8">
              No receipts found for run: {searchedRunId}
            </p>
          </PanelContent>
        </Panel>
      )}

      {summary && (
        <>
          {/* Summary */}
          <Panel notch noise>
            <PanelHeader>
              <span className="font-mono text-sm uppercase tracking-wider text-[--flash]">
                Run Summary
              </span>
              <Badge variant="healthy">{summary.count} RECEIPTS</Badge>
            </PanelHeader>
            <PanelContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                    Run ID
                  </p>
                  <p className="font-mono text-sm text-[--flash]">{summary.runId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                    First Receipt
                  </p>
                  <p className="font-mono text-sm text-[--steel]">
                    {summary.firstReceiptAt
                      ? new Date(summary.firstReceiptAt).toISOString().slice(0, 19).replace("T", " ")
                      : "\u2014"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                    Last Receipt
                  </p>
                  <p className="font-mono text-sm text-[--steel]">
                    {summary.lastReceiptAt
                      ? new Date(summary.lastReceiptAt).toISOString().slice(0, 19).replace("T", " ")
                      : "\u2014"}
                  </p>
                </div>
              </div>
            </PanelContent>
          </Panel>

          {/* Receipt Chain */}
          <Panel noise>
            <PanelHeader>Receipt Chain</PanelHeader>
            <PanelContent className="space-y-0">
              {summary.receiptIds.map((id, idx) => (
                <div key={id} className="flex items-center gap-3">
                  {/* Chain link indicator */}
                  <div className="flex flex-col items-center w-6">
                    <div className="w-2 h-2 rounded-full bg-[--reactor-blue] shadow-[0_0_4px_rgba(69,162,158,0.5)]" />
                    {idx < summary.receiptIds.length - 1 && (
                      <div className="w-px h-6 bg-[--reactor-blue]/40" />
                    )}
                  </div>
                  <Link
                    href={`/collective/receipts/${id}`}
                    className="font-mono text-sm text-[--reactor-blue] hover:underline py-2"
                  >
                    {id}
                  </Link>
                  {idx === 0 && (
                    <Badge variant="neutral" className="ml-auto">
                      FIRST
                    </Badge>
                  )}
                  {idx === summary.receiptIds.length - 1 && idx !== 0 && (
                    <Badge variant="healthy" className="ml-auto">
                      LATEST
                    </Badge>
                  )}
                </div>
              ))}
            </PanelContent>
          </Panel>
        </>
      )}
    </div>
  );
}
