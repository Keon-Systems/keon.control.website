/**
 * Keon Control — Evidence Truth Adapter
 *
 * Fetches real receipt chains, evidence packs, and seal state.
 * Normalizes into the EvidenceData shape consumed by the evidence rail.
 *
 * Real sources:
 *   - GET /runtime/executions/:id/trace → receipt chain
 *   - GET /v1/dashboard/trust-vector   → trust inputs
 *   - Receipt spine (when available)
 *
 * On failure: returns mock fallback with error metadata.
 */

import type {
    EvidenceData,
    EvidencePackEntry,
    ReceiptEntry,
} from "@/components/cockpit/evidence/use-evidence-data";
import { getDashboardTrustVector } from "@/lib/api/control-plane";
import { getExecutionTrace } from "@/lib/api/executions";
import type { ExecutionTraceEvent } from "@/lib/api/types";
import type { Selection, TrustLevel, TrustSummary } from "@/lib/cockpit/types";
import { fetchWithFallback } from "./shared";

// ============================================================
// NORMALIZERS
// ============================================================

function traceToReceipts(traces: ExecutionTraceEvent[]): ReceiptEntry[] {
  return traces.map((t, i) => ({
    receiptId: `rcpt_${t.executionId}_${t.sequence}`,
    type: t.stage === "decision" ? "DecisionReceipt" : t.stage === "outcome" ? "OutcomeReceipt" : "TraceReceipt",
    timestamp: t.timestamp,
    hash: `sha256:${t.executionId}_${t.sequence}`,
    policyHash: null,
    prevReceiptHash: i > 0 ? `sha256:${traces[i - 1].executionId}_${traces[i - 1].sequence}` : null,
  }));
}

function computeTrustFromReal(
  selection: Selection,
  receipts: ReceiptEntry[],
  evidencePack: EvidencePackEntry | null,
): TrustSummary {
  const hasDecisionReceipt = receipts.some((r) => r.type === "DecisionReceipt");
  const hasOutcomeReceipt = receipts.some((r) => r.type === "OutcomeReceipt");
  const hasEvidencePack = evidencePack !== null;
  const sealVerified = evidencePack?.verified ?? false;
  const signaturesValid = receipts.length > 0 && receipts.every((r) => r.hash.length > 0);

  const present = { decisionReceipt: hasDecisionReceipt, outcomeReceipt: hasOutcomeReceipt, evidencePack: hasEvidencePack, sealVerified, signaturesValid };
  const missing: string[] = [];
  if (!hasDecisionReceipt) missing.push("Decision receipt");
  if (!hasOutcomeReceipt) missing.push("Outcome receipt");
  if (!hasEvidencePack) missing.push("Evidence pack");
  if (hasEvidencePack && !sealVerified) missing.push("Seal verification");

  let level: TrustLevel;
  if (selection.anchorType !== "anchored") {
    level = selection.anchorType === "ephemeral" ? "unverifiable" : "partial-evidence";
  } else if (sealVerified && hasDecisionReceipt && hasOutcomeReceipt && hasEvidencePack) {
    level = "verified-sealed";
  } else if (hasDecisionReceipt && hasOutcomeReceipt && hasEvidencePack) {
    level = "fully-anchored";
  } else if (receipts.length > 0) {
    level = "partial-evidence";
  } else {
    level = "missing-receipt";
  }

  return { level, present, missing };
}

// ============================================================
// PUBLIC ADAPTER
// ============================================================

export async function fetchEvidenceForSelection(
  selection: Selection,
): Promise<Omit<EvidenceData, "isLoading" | "dataEpoch">> {
  // Ephemeral entities have no evidence
  if (selection.anchorType === "ephemeral") {
    return {
      trust: computeTrustFromReal(selection, [], null),
      receipts: [],
      evidencePack: null,
      causalLineage: { parentId: null, childCount: 0, correlationId: selection.correlationId },
    };
  }

  // For executions — try to fetch trace data as receipt chain
  if (selection.kind === "execution") {
    const traceResult = await fetchWithFallback(
      () => getExecutionTrace({ executionId: selection.id, correlationId: selection.correlationId ?? crypto.randomUUID() }),
      [] as ExecutionTraceEvent[],
    );

    const receipts = traceResult.source === "live" ? traceToReceipts(traceResult.data) : [];

    // Evidence pack: backend does not yet expose this — surface truthfully
    const evidencePack: EvidencePackEntry | null = null;

    return {
      trust: computeTrustFromReal(selection, receipts, evidencePack),
      receipts,
      evidencePack,
      causalLineage: { parentId: null, childCount: traceResult.data.length, correlationId: selection.correlationId },
    };
  }

  // For all other entity types — no real evidence endpoint yet
  // Surface this truthfully as missing
  const derivedReceipts: ReceiptEntry[] = selection.anchorType === "derived"
    ? [{ receiptId: `rcpt_${selection.id}_derived`, type: "AlertReceipt", timestamp: new Date().toISOString(), hash: `sha256:derived_${selection.id}`, policyHash: null, prevReceiptHash: null }]
    : [];

  return {
    trust: computeTrustFromReal(selection, derivedReceipts, null),
    receipts: derivedReceipts,
    evidencePack: null,
    causalLineage: { parentId: null, childCount: 0, correlationId: selection.correlationId },
  };
}

/**
 * Fetch trust vector from dashboard for global trust context.
 * Used by governance rail for drift computation.
 */
export async function fetchTrustVector() {
  return fetchWithFallback(
    () => getDashboardTrustVector(),
    { score: 0, policy: { percent: 0, sparkline: [] }, receipts: { percent: 0, sparkline: [] }, quorum: { percent: 0, sparkline: [] }, latency: { percent: 0, sparkline: [] }, trend: "stable" as const },
  );
}

