/**
 * Keon Control — Executions Adapter
 *
 * Fetches real execution data from /runtime/executions and normalizes
 * into the ExecutionRow shape consumed by ExecutionsMode.
 *
 * Real source: GET /runtime/executions → ExecutionPage
 * On failure: returns mock fallback with error metadata.
 */

import { listExecutions } from "@/lib/api/executions";
import type { ExecutionResult } from "@/lib/api/types";
import type { AnchorType } from "@/lib/cockpit/types";
import { fetchWithFallback, safeCount } from "./shared";

// ============================================================
// COCKPIT-FACING SHAPE (matches existing ExecutionRow)
// ============================================================

export interface ExecutionRow {
  executionId: string;
  receiptId: string;
  status: "completed" | "failed" | "running" | "denied";
  actor: string;
  action: string;
  startedAt: string;
  duration: number;
  traceCount: number;
}

// ============================================================
// NORMALIZER
// ============================================================

function normalizeStatus(apiStatus: ExecutionResult["status"]): ExecutionRow["status"] {
  switch (apiStatus) {
    case "completed": return "completed";
    case "failed":
    case "aborted": return "failed";
    case "running":
    case "started": return "running";
    default: return "completed";
  }
}

function normalizeExecution(result: ExecutionResult): ExecutionRow {
  const metadata = result.metadata ?? {};
  return {
    executionId: result.executionId,
    receiptId: (metadata.receiptId as string) ?? "",
    status: normalizeStatus(result.status),
    actor: (metadata.actor as string) ?? "unknown",
    action: (metadata.action as string) ?? "unknown",
    startedAt: result.timing.startedAt,
    duration: result.timing.durationMs ?? 0,
    traceCount: safeCount(metadata.traceCount as number),
  };
}

// ============================================================
// ANCHOR TYPE (same law as existing component)
// ============================================================

export function computeExecutionAnchorType(status: ExecutionRow["status"]): AnchorType {
  if (status === "running") return "ephemeral";
  if (status === "denied") return "derived";
  return "anchored";
}

// ============================================================
// MOCK FALLBACK
// ============================================================

const MOCK_EXECUTIONS: ExecutionRow[] = [
  { executionId: "exec_01923e6a46a977f29cba9c9f2f8a8f7c", receiptId: "rcpt_01923e6a46a977f29cba9c9f2f8a8f7c", status: "completed", actor: "agent-gpt4", action: "data.export", startedAt: "2026-03-23T14:00:00.000Z", duration: 2340, traceCount: 12 },
  { executionId: "exec_01923e5b2c8a77f29cba9c9f2f8a8f7d", receiptId: "rcpt_01923e5b2c8a77f29cba9c9f2f8a8f7d", status: "failed", actor: "agent-claude", action: "budget.approve", startedAt: "2026-03-23T13:30:00.000Z", duration: 890, traceCount: 5 },
  { executionId: "exec_01923e4d1b7a77f29cba9c9f2f8a8f7e", receiptId: "rcpt_01923e4d1b7a77f29cba9c9f2f8a8f7e", status: "completed", actor: "agent-gemini", action: "policy.evaluate", startedAt: "2026-03-23T12:00:00.000Z", duration: 1560, traceCount: 8 },
  { executionId: "exec_running_001", receiptId: "", status: "running", actor: "agent-gpt4", action: "report.generate", startedAt: "2026-03-23T14:55:00.000Z", duration: 0, traceCount: 3 },
  { executionId: "exec_denied_001", receiptId: "", status: "denied", actor: "agent-claude", action: "admin.override", startedAt: "2026-03-23T14:50:00.000Z", duration: 0, traceCount: 0 },
];

// ============================================================
// PUBLIC ADAPTER
// ============================================================

export async function fetchExecutions(correlationId?: string): Promise<{
  rows: ExecutionRow[];
  source: "live" | "mock";
  error: string | null;
}> {
  const result = await fetchWithFallback(
    async () => {
      const page = await listExecutions({
        correlationId: correlationId ?? crypto.randomUUID(),
        limit: 50,
      });
      return page.items.map(normalizeExecution);
    },
    MOCK_EXECUTIONS,
  );

  return { rows: result.data, source: result.source, error: result.error };
}

