"use client";

/**
 * Evidence Mode — Evidence pack browser.
 * Seal status, artifact count, anchoring chains.
 */

import { useFocusSelection, useSelectionActions } from "@/lib/cockpit/use-focus";
import { formatHash, formatTimestamp } from "@/lib/format";
import type { Selection } from "@/lib/cockpit/types";

interface EvidencePackRow {
  packId: string;
  entityKind: string;
  entityId: string;
  sealStatus: "sealed" | "pending" | "failed";
  artifactCount: number;
  createdAt: string;
  sealHash: string;
}

const MOCK_PACKS: EvidencePackRow[] = [
  { packId: "pack_001", entityKind: "execution", entityId: "exec_01923e6a", sealStatus: "sealed", artifactCount: 4, createdAt: "2026-03-23T14:01:00.000Z", sealHash: "sha256:seal1a2b" },
  { packId: "pack_002", entityKind: "execution", entityId: "exec_01923e5b", sealStatus: "sealed", artifactCount: 3, createdAt: "2026-03-23T13:31:00.000Z", sealHash: "sha256:seal3c4d" },
  { packId: "pack_003", entityKind: "execution", entityId: "exec_01923e4d", sealStatus: "sealed", artifactCount: 5, createdAt: "2026-03-23T12:01:00.000Z", sealHash: "sha256:seal5e6f" },
  { packId: "pack_004", entityKind: "decision", entityId: "dec_001", sealStatus: "pending", artifactCount: 2, createdAt: "2026-03-23T14:02:00.000Z", sealHash: "" },
  { packId: "pack_005", entityKind: "incident", entityId: "inc_003", sealStatus: "sealed", artifactCount: 12, createdAt: "2026-03-22T08:30:00.000Z", sealHash: "sha256:seal7g8h" },
  { packId: "pack_006", entityKind: "execution", entityId: "exec_denied_001", sealStatus: "failed", artifactCount: 1, createdAt: "2026-03-23T14:51:00.000Z", sealHash: "" },
];

const SEAL_CONFIG: Record<string, { label: string; color: string; heat: string }> = {
  sealed:  { label: "SEALED",  color: "text-[#66FCF1]", heat: "bg-[#66FCF1]" },
  pending: { label: "PENDING", color: "text-amber-400", heat: "bg-amber-400" },
  failed:  { label: "FAILED",  color: "text-[#E94560]", heat: "bg-[#E94560]" },
};

export function EvidenceMode() {
  const { selection } = useFocusSelection();
  const { select } = useSelectionActions();

  const handleClick = (row: EvidencePackRow) => {
    const sel: Selection = {
      kind: "evidence-pack",
      id: row.packId,
      correlationId: row.entityId,
      source: "center",
      anchorType: row.sealStatus === "sealed" ? "anchored" : "derived",
    };
    select(sel);
  };

  return (
    <div className="flex flex-col overflow-hidden">
      <div className="flex shrink-0 border-b border-[#1F2833]/40 bg-[#0B0C10]">
        <div className="w-1 shrink-0" />
        <div className="flex-1 grid grid-cols-[1fr_1.5fr_0.8fr_0.5fr_1.5fr] gap-2 px-3 py-2">
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Entity</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Pack ID</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Seal</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Arts</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Created</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {MOCK_PACKS.map((row) => {
          const isSelected = selection?.id === row.packId;
          const config = SEAL_CONFIG[row.sealStatus] ?? SEAL_CONFIG.pending;
          return (
            <button
              key={row.packId}
              onClick={() => handleClick(row)}
              className={`flex w-full text-left border-b border-[#1F2833]/20 transition-colors ${isSelected ? "bg-[#1F2833]/50" : "hover:bg-[#1F2833]/20"}`}
            >
              <div className={`w-1 shrink-0 ${isSelected ? config.heat : config.heat + "/30"}`} />
              <div className="flex-1 grid grid-cols-[1fr_1.5fr_0.8fr_0.5fr_1.5fr] gap-2 px-3 py-2.5 items-center">
                <div className="min-w-0">
                  <div className="text-[10px] font-mono text-[#45A29E]/70">{row.entityKind}</div>
                  <div className="text-[9px] font-mono text-[#C5C6C7]/25 truncate">{row.entityId}</div>
                </div>
                <span className="text-[10px] font-mono text-[#C5C6C7]/50 truncate">
                  {formatHash(row.packId)}
                  {row.sealHash && <span className="text-[#C5C6C7]/20 ml-1">{formatHash(row.sealHash)}</span>}
                </span>
                <span className={`text-[10px] font-mono font-bold ${config.color}`}>{config.label}</span>
                <span className="text-[10px] font-mono text-[#C5C6C7]/40 tabular-nums">{row.artifactCount}</span>
                <span className="text-[10px] font-mono text-[#C5C6C7]/40">{formatTimestamp(new Date(row.createdAt))}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

