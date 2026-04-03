"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Panel, PanelContent, PanelHeader } from "@/components/ui";

type ReceiptDetail = {
  receiptId: string;
  runId: string;
  type: string;
  timestamp: string;
  policyHash?: string;
  payloadHash?: string;
  prevReceiptHash?: string;
  hash: string;
  payload?: Record<string, unknown>;
};

const MOCK_RECEIPTS: Record<string, ReceiptDetail> = {
  "rcpt-a001-0001": {
    receiptId: "rcpt-a001-0001",
    runId: "run-alpha-001",
    type: "POLICY_EVALUATION",
    timestamp: "2026-03-14T10:30:00Z",
    policyHash: "sha256:a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
    payloadHash: "sha256:1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff",
    hash: "sha256:aaaa1111bbbb2222cccc3333dddd4444eeee5555ffff6666777788889999aaaa",
    payload: {
      decision: "ALLOW",
      riskLevel: "LOW",
      evaluatedAt: "2026-03-14T10:30:00Z",
    },
  },
  "rcpt-a001-0002": {
    receiptId: "rcpt-a001-0002",
    runId: "run-alpha-001",
    type: "TOOL_INVOCATION",
    timestamp: "2026-03-14T10:30:12Z",
    payloadHash: "sha256:2222333344445555666677778888999900001111aaaabbbbccccddddeeeeffff",
    prevReceiptHash: "sha256:aaaa1111bbbb2222cccc3333dddd4444eeee5555ffff6666777788889999aaaa",
    hash: "sha256:bbbb2222cccc3333dddd4444eeee5555ffff6666777788889999aaaa1111bbbb",
    payload: {
      toolName: "web_search",
      arguments: { query: "market analysis" },
      result: "success",
    },
  },
  "rcpt-a001-0003": {
    receiptId: "rcpt-a001-0003",
    runId: "run-alpha-001",
    type: "LLM_COMPLETION",
    timestamp: "2026-03-14T10:30:30Z",
    payloadHash: "sha256:3333444455556666777788889999000011112222aaaabbbbccccddddeeeeffff",
    prevReceiptHash: "sha256:bbbb2222cccc3333dddd4444eeee5555ffff6666777788889999aaaa1111bbbb",
    hash: "sha256:cccc3333dddd4444eeee5555ffff6666777788889999aaaa1111bbbb2222cccc",
  },
  "rcpt-a001-0004": {
    receiptId: "rcpt-a001-0004",
    runId: "run-alpha-001",
    type: "SEAL",
    timestamp: "2026-03-14T10:30:42Z",
    prevReceiptHash: "sha256:cccc3333dddd4444eeee5555ffff6666777788889999aaaa1111bbbb2222cccc",
    hash: "sha256:dddd4444eeee5555ffff6666777788889999aaaa1111bbbb2222cccc3333dddd",
  },
  "rcpt-b002-0001": {
    receiptId: "rcpt-b002-0001",
    runId: "run-beta-002",
    type: "POLICY_EVALUATION",
    timestamp: "2026-03-13T14:15:00Z",
    policyHash: "sha256:b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
    payloadHash: "sha256:4444555566667777888899990000111122223333aaaabbbbccccddddeeeeffff",
    hash: "sha256:eeee5555ffff6666777788889999aaaa1111bbbb2222cccc3333dddd4444eeee",
  },
  "rcpt-b002-0002": {
    receiptId: "rcpt-b002-0002",
    runId: "run-beta-002",
    type: "SEAL",
    timestamp: "2026-03-13T14:15:18Z",
    prevReceiptHash: "sha256:eeee5555ffff6666777788889999aaaa1111bbbb2222cccc3333dddd4444eeee",
    hash: "sha256:ffff6666777788889999aaaa1111bbbb2222cccc3333dddd4444eeee5555ffff",
  },
};

function truncateHash(hash: string): string {
  const hex = hash.replace("sha256:", "");
  return hex.slice(0, 16);
}

function CopyableHash({ label, hash }: { label: string; hash?: string }) {
  const [copied, setCopied] = useState(false);

  if (!hash) {
    return (
      <tr className="border-b border-[--tungsten]/20">
        <td className="px-4 py-2 text-[10px] font-mono uppercase tracking-wide text-[--tungsten] w-40">
          {label}
        </td>
        <td className="px-4 py-2 font-mono text-sm text-[--tungsten]">&mdash;</td>
        <td className="px-4 py-2 w-16" />
      </tr>
    );
  }

  function handleCopy() {
    if (!hash) return;
    navigator.clipboard.writeText(hash).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <tr className="border-b border-[--tungsten]/20">
      <td className="px-4 py-2 text-[10px] font-mono uppercase tracking-wide text-[--tungsten] w-40">
        {label}
      </td>
      <td className="px-4 py-2 font-mono text-sm text-[--steel]" title={hash}>
        sha256:{truncateHash(hash)}
      </td>
      <td className="px-4 py-2 w-16">
        <button
          type="button"
          onClick={handleCopy}
          className="font-mono text-[10px] text-[--reactor-blue] hover:text-[--flash] uppercase tracking-wide"
        >
          {copied ? "DONE" : "COPY"}
        </button>
      </td>
    </tr>
  );
}

export function ReceiptDetailClient({ receiptId }: { receiptId: string }) {
  const receipt = MOCK_RECEIPTS[receiptId];

  if (!receipt) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="font-mono text-lg uppercase tracking-wider text-[--flash]">
          Receipt Not Found
        </h1>
        <Panel notch noise>
          <PanelContent>
            <p className="font-mono text-sm text-[--steel]">
              No receipt found for ID: {receiptId}
            </p>
            <Link
              href="/collective/receipts"
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
          href="/collective/receipts"
          className="font-mono text-xs text-[--steel] hover:text-[--reactor-blue]"
        >
          RECEIPTS
        </Link>
        <span className="font-mono text-xs text-[--tungsten]">/</span>
        <h1 className="font-mono text-lg uppercase tracking-wider text-[--flash]">
          {receipt.receiptId}
        </h1>
      </div>

      {/* Receipt Metadata */}
      <Panel notch noise>
        <PanelHeader>
          <span className="font-mono text-sm uppercase tracking-wider text-[--flash]">
            Receipt Detail
          </span>
          <Badge variant="neutral">{receipt.type}</Badge>
        </PanelHeader>
        <PanelContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                Receipt ID
              </p>
              <p className="font-mono text-sm text-[--flash]">{receipt.receiptId}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                Run ID
              </p>
              <Link
                href={`/collective/executions/${receipt.runId}`}
                className="font-mono text-sm text-[--reactor-blue] hover:underline block"
              >
                {receipt.runId}
              </Link>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                Type
              </p>
              <p className="font-mono text-sm text-[--flash]">{receipt.type}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                Timestamp
              </p>
              <p className="font-mono text-sm text-[--steel]">
                {new Date(receipt.timestamp).toISOString().slice(0, 19).replace("T", " ")}
              </p>
            </div>
          </div>
        </PanelContent>
      </Panel>

      {/* Hash Table */}
      <Panel noise>
        <PanelHeader>Hash Chain</PanelHeader>
        <PanelContent className="p-0">
          <table className="w-full font-mono text-sm">
            <tbody>
              <CopyableHash label="Payload Hash" hash={receipt.payloadHash} />
              <CopyableHash label="Policy Hash" hash={receipt.policyHash} />
              <CopyableHash label="Prev Receipt" hash={receipt.prevReceiptHash} />
              <CopyableHash label="Receipt Hash" hash={receipt.hash} />
            </tbody>
          </table>
        </PanelContent>
      </Panel>

      {/* Payload */}
      {receipt.payload && (
        <Panel noise>
          <PanelHeader>Payload</PanelHeader>
          <PanelContent>
            <pre className="font-mono text-xs text-[--steel] bg-[--void] border border-[--tungsten] p-4 rounded-sm overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(receipt.payload, null, 2)}
            </pre>
          </PanelContent>
        </Panel>
      )}
    </div>
  );
}
