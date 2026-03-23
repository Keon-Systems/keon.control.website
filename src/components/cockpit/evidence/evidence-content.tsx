"use client";

/**
 * Evidence Content — Selection-reactive proof surface.
 *
 * Shows:
 *   - Receipt chain (ordered, with hash linkage)
 *   - Evidence pack (seal status, artifact count)
 *   - Causal lineage (parent, children, correlation)
 *   - Depth controls
 *
 * Epoch-guarded: never shows stale data.
 */

import { useFocusDepth, useFocusSelection, useSelectionActions } from "@/lib/cockpit/use-focus";
import { formatHash, formatTimestamp } from "@/lib/format";
import type { EvidenceData, EvidencePackEntry, ReceiptEntry } from "./use-evidence-data";

interface EvidenceContentProps {
  data: EvidenceData;
}

export function EvidenceContent({ data }: EvidenceContentProps) {
  const { selection } = useFocusSelection();
  const { inspectionDepth, canVerify, canForensic } = useFocusDepth();
  const { setDepth } = useSelectionActions();

  if (!selection) return null;

  return (
    <div className="space-y-3">
      {/* Entity Identity */}
      <div className="rounded border border-[#1F2833]/30 bg-[#0B0C10]/60 p-3">
        <div className="text-[9px] font-mono text-[#C5C6C7]/40 mb-2 uppercase">Selected Entity</div>
        <div className="space-y-1 text-[10px] font-mono">
          <div className="text-[#C5C6C7]/40">Kind: <span className="text-[#66FCF1]">{selection.kind}</span></div>
          <div className="text-[#C5C6C7]/40">ID: <span className="text-[#45A29E]">{formatHash(selection.id)}</span></div>
          {selection.correlationId && (
            <div className="text-[#C5C6C7]/40">Corr: <span className="text-[#C5C6C7]/50">{formatHash(selection.correlationId)}</span></div>
          )}
        </div>
      </div>

      {/* Receipt Chain */}
      <ReceiptChain receipts={data.receipts} isLoading={data.isLoading} />

      {/* Evidence Pack */}
      {data.evidencePack && <EvidencePackCard pack={data.evidencePack} />}

      {/* Causal Lineage */}
      <div className="rounded border border-[#1F2833]/30 bg-[#0B0C10]/60 p-3">
        <div className="text-[9px] font-mono text-[#C5C6C7]/40 mb-2 uppercase">Causal Lineage</div>
        <div className="space-y-1 text-[10px] font-mono text-[#C5C6C7]/50">
          <div>Parent: <span className="text-[#45A29E]">{data.causalLineage.parentId ? formatHash(data.causalLineage.parentId) : "root"}</span></div>
          <div>Children: <span className="text-[#C5C6C7]/40">{data.causalLineage.childCount}</span></div>
          {data.causalLineage.correlationId && (
            <div>Thread: <span className="text-[#45A29E]">{formatHash(data.causalLineage.correlationId)}</span></div>
          )}
        </div>
      </div>

      {/* Depth Controls */}
      <div className="rounded border border-[#1F2833]/30 bg-[#0B0C10]/60 p-3">
        <div className="text-[9px] font-mono text-[#C5C6C7]/40 mb-2 uppercase">Inspection Depth</div>
        <div className="flex gap-2">
          {(["scan", "inspect", "verify", "forensic"] as const).map((d) => {
            const isActive = inspectionDepth === d;
            const isAvailable = d === "scan" || d === "inspect"
              || (d === "verify" && canVerify)
              || (d === "forensic" && canForensic);

            return (
              <button
                key={d}
                onClick={() => isAvailable && setDepth(d)}
                disabled={!isAvailable}
                className={`px-2 py-1 rounded text-[10px] font-mono border transition-colors ${
                  isActive
                    ? "border-[#66FCF1]/40 text-[#66FCF1] bg-[#66FCF1]/10"
                    : isAvailable
                      ? "border-[#1F2833]/40 text-[#C5C6C7]/50 hover:border-[#45A29E]/30 hover:text-[#C5C6C7]/70"
                      : "border-[#1F2833]/20 text-[#C5C6C7]/15 cursor-not-allowed"
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function ReceiptChain({ receipts, isLoading }: { receipts: ReceiptEntry[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="rounded border border-[#1F2833]/30 bg-[#0B0C10]/60 p-3 animate-pulse">
        <div className="h-3 w-20 bg-[#1F2833]/40 rounded mb-3" />
        <div className="space-y-2">
          <div className="h-8 bg-[#1F2833]/20 rounded" />
          <div className="h-8 bg-[#1F2833]/20 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded border border-[#1F2833]/30 bg-[#0B0C10]/60 p-3">
      <div className="text-[9px] font-mono text-[#C5C6C7]/40 mb-2 uppercase">
        Receipt Chain ({receipts.length})
      </div>
      {receipts.length === 0 ? (
        <div className="text-[10px] font-mono text-[#C5C6C7]/25">No receipts</div>
      ) : (
        <div className="space-y-2">
          {receipts.map((r, i) => (
            <div key={r.receiptId} className="flex items-start gap-2">
              {/* Chain connector */}
              <div className="flex flex-col items-center shrink-0 mt-1">
                <div className="h-1.5 w-1.5 rounded-full bg-[#66FCF1]/60" />
                {i < receipts.length - 1 && <div className="w-px h-6 bg-[#1F2833]/40" />}
              </div>
              {/* Receipt detail */}
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-mono text-[#66FCF1]/70">{r.type}</div>
                <div className="text-[9px] font-mono text-[#C5C6C7]/30 truncate">
                  {formatHash(r.hash)}
                  {r.prevReceiptHash && (
                    <span className="text-[#C5C6C7]/20"> ← {formatHash(r.prevReceiptHash)}</span>
                  )}
                </div>
                <div className="text-[9px] font-mono text-[#C5C6C7]/20">
                  {formatTimestamp(new Date(r.timestamp))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EvidencePackCard({ pack }: { pack: EvidencePackEntry }) {
  return (
    <div className={`rounded border p-3 ${
      pack.verified
        ? "border-[#66FCF1]/20 bg-[#66FCF1]/5"
        : "border-amber-400/20 bg-amber-400/5"
    }`}>
      <div className="text-[9px] font-mono text-[#C5C6C7]/40 mb-2 uppercase">Evidence Pack</div>
      <div className="space-y-1 text-[10px] font-mono">
        <div className="text-[#C5C6C7]/50">Pack: <span className="text-[#45A29E]">{formatHash(pack.packId)}</span></div>
        <div className="text-[#C5C6C7]/50">Seal: <span className="text-[#45A29E]">{formatHash(pack.sealHash)}</span></div>
        <div className={pack.verified ? "text-[#66FCF1]" : "text-amber-400"}>
          {pack.verified ? "● Seal Verified" : "○ Seal Unverified"}
        </div>
        <div className="text-[#C5C6C7]/40">{pack.artifactCount} artifacts</div>
      </div>
    </div>
  );
}

