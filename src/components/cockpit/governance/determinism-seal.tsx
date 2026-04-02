"use client";

/**
 * Determinism Seal — Shows whether the system's determinism guarantee holds.
 * SEALED = all outputs reproducible. DEGRADED = partial. UNKNOWN = no data.
 */

interface DeterminismSealProps {
  status: string;
  sealValidation: string;
}

const SEAL_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  SEALED:   { icon: "●", color: "text-[#66FCF1]", label: "Determinism Sealed" },
  DEGRADED: { icon: "◐", color: "text-amber-400", label: "Determinism Degraded" },
  UNKNOWN:  { icon: "○", color: "text-[#C5C6C7]/40", label: "Determinism Unknown" },
};

const VALIDATION_CONFIG: Record<string, { color: string }> = {
  VALID:   { color: "text-[#66FCF1]/60" },
  INVALID: { color: "text-[#E94560]/60" },
  PENDING: { color: "text-amber-400/60" },
};

export function DeterminismSeal({ status, sealValidation }: DeterminismSealProps) {
  const seal = SEAL_CONFIG[status] ?? SEAL_CONFIG.UNKNOWN;
  const validation = VALIDATION_CONFIG[sealValidation] ?? VALIDATION_CONFIG.PENDING;

  return (
    <div className="border-b border-[#1F2833]/20 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span className={`text-xs ${seal.color}`}>{seal.icon}</span>
        <span className={`text-[10px] font-mono font-bold ${seal.color}`}>{seal.label}</span>
      </div>
      <div className={`text-[9px] font-mono mt-1 ${validation.color}`}>
        Seal validation: {sealValidation.toLowerCase()}
      </div>
    </div>
  );
}

