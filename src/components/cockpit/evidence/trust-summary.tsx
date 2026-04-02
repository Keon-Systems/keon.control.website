"use client";

/**
 * Trust Summary — The credibility verdict.
 *
 * Shows at a glance:
 *   - Trust level (verified-sealed → unverifiable)
 *   - What proofs are present
 *   - What proofs are missing
 *   - Seal status
 *
 * This is the first thing the operator sees when selecting an entity.
 * It must answer: "Can I trust this?" without scrolling.
 */

import type { TrustSummary as TrustSummaryType, TrustLevel } from "@/lib/cockpit/types";

const TRUST_CONFIG: Record<TrustLevel, { label: string; icon: string; color: string; border: string; bg: string }> = {
  "verified-sealed":  { label: "VERIFIED & SEALED",  icon: "🔒", color: "text-[#66FCF1]",   border: "border-[#66FCF1]/30", bg: "bg-[#66FCF1]/5" },
  "fully-anchored":   { label: "FULLY ANCHORED",     icon: "⚓", color: "text-[#45A29E]",   border: "border-[#45A29E]/30", bg: "bg-[#45A29E]/5" },
  "partial-evidence": { label: "PARTIAL EVIDENCE",   icon: "◐",  color: "text-amber-400",   border: "border-amber-400/30", bg: "bg-amber-400/5" },
  "missing-receipt":  { label: "MISSING RECEIPT",     icon: "⚠",  color: "text-[#E94560]",   border: "border-[#E94560]/30", bg: "bg-[#E94560]/5" },
  "unverifiable":     { label: "UNVERIFIABLE",        icon: "○",  color: "text-[#C5C6C7]/50", border: "border-[#C5C6C7]/20", bg: "bg-[#C5C6C7]/5" },
};

interface TrustSummaryProps {
  trust: TrustSummaryType;
  isLoading: boolean;
}

export function TrustSummary({ trust, isLoading }: TrustSummaryProps) {
  if (isLoading) {
    return (
      <div className="rounded border border-[#1F2833]/30 bg-[#0B0C10]/60 p-3 animate-pulse">
        <div className="h-3 w-24 bg-[#1F2833]/40 rounded mb-2" />
        <div className="h-4 w-32 bg-[#1F2833]/30 rounded" />
      </div>
    );
  }

  const config = TRUST_CONFIG[trust.level];

  return (
    <div className={`rounded border ${config.border} ${config.bg} p-3`}>
      {/* Trust Level */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">{config.icon}</span>
        <span className={`text-[11px] font-mono font-bold tracking-wider ${config.color}`}>
          {config.label}
        </span>
      </div>

      {/* Proof Checklist */}
      <div className="space-y-1">
        <ProofLine label="Decision Receipt" present={trust.present.decisionReceipt} />
        <ProofLine label="Outcome Receipt" present={trust.present.outcomeReceipt} />
        <ProofLine label="Evidence Pack" present={trust.present.evidencePack} />
        <ProofLine label="Seal Verified" present={trust.present.sealVerified} />
        <ProofLine label="Signatures Valid" present={trust.present.signaturesValid} />
      </div>

      {/* Missing Proofs */}
      {trust.missing.length > 0 && (
        <div className="mt-2 pt-2 border-t border-[#1F2833]/20">
          <div className="text-[9px] font-mono text-[#E94560]/60 uppercase mb-1">Missing</div>
          {trust.missing.map((m) => (
            <div key={m} className="text-[10px] font-mono text-[#E94560]/50">
              — {m}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProofLine({ label, present }: { label: string; present: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-[10px] ${present ? "text-[#66FCF1]" : "text-[#C5C6C7]/20"}`}>
        {present ? "●" : "○"}
      </span>
      <span className={`text-[10px] font-mono ${present ? "text-[#C5C6C7]/60" : "text-[#C5C6C7]/25"}`}>
        {label}
      </span>
    </div>
  );
}

