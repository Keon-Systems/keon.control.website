"use client";

/**
 * Evidence Rail — Selection-Reactive Data Hook
 *
 * Fetches evidence data keyed to the current selection.
 * Real data via evidence.adapter with automatic fallback.
 * Epoch-guarded: discards stale responses.
 * Loading discipline: skeleton → data, never flash wrong data.
 */

import { fetchEvidenceForSelection } from "@/lib/cockpit/adapters/evidence.adapter";
import type { TrustSummary } from "@/lib/cockpit/types";
import { useFocusSelection } from "@/lib/cockpit/use-focus";
import { useEffect, useRef, useState } from "react";

// ============================================================
// DATA SHAPES (unchanged — this IS the contract)
// ============================================================

export interface ReceiptEntry {
  receiptId: string;
  type: string;
  timestamp: string;
  hash: string;
  policyHash: string | null;
  prevReceiptHash: string | null;
}

export interface EvidencePackEntry {
  packId: string;
  sealHash: string;
  verified: boolean;
  artifactCount: number;
}

export interface EvidenceData {
  /** Loading state — skeleton while true */
  isLoading: boolean;
  /** The epoch this data was fetched for */
  dataEpoch: number;
  /** Trust assessment */
  trust: TrustSummary;
  /** Receipt chain for this entity */
  receipts: ReceiptEntry[];
  /** Evidence pack (if anchored) */
  evidencePack: EvidencePackEntry | null;
  /** Causal lineage summary */
  causalLineage: {
    parentId: string | null;
    childCount: number;
    correlationId: string | null;
  };
}

// ============================================================
// HOOK
// ============================================================

export function useEvidenceData(): EvidenceData | null {
  const { selection, selectionEpoch, isSelectionActive } = useFocusSelection();
  const [data, setData] = useState<EvidenceData | null>(null);
  const fetchEpochRef = useRef<number>(0);

  useEffect(() => {
    if (!isSelectionActive || !selection) {
      setData(null);
      return;
    }

    // Epoch guard: track which epoch we're fetching for
    const currentEpoch = selectionEpoch;
    fetchEpochRef.current = currentEpoch;

    // Enter loading state immediately — never show stale data
    setData({ isLoading: true, dataEpoch: currentEpoch, trust: { level: "unverifiable", present: { decisionReceipt: false, outcomeReceipt: false, evidencePack: false, sealVerified: false, signaturesValid: false }, missing: [] }, receipts: [], evidencePack: null, causalLineage: { parentId: null, childCount: 0, correlationId: null } });

    // Real async fetch via evidence adapter
    let cancelled = false;
    (async () => {
      const evidence = await fetchEvidenceForSelection(selection);
      // Epoch guard: discard if selection changed during fetch
      if (cancelled || fetchEpochRef.current !== currentEpoch) return;
      setData({ ...evidence, isLoading: false, dataEpoch: currentEpoch });
    })();

    return () => { cancelled = true; };
  }, [selection, selectionEpoch, isSelectionActive]);

  return data;
}

