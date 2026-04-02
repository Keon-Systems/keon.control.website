/**
 * Governance Semantic Color Contract
 *
 * Every governance view MUST use this contract for status-to-badge mapping.
 * This ensures a single, consistent visual language across the entire
 * operator surface.
 *
 * Contract:
 *   SEALED       -> healthy   (teal / reactor-blue)
 *   COMPLETED    -> healthy   (teal / reactor-blue)
 *   RUNNING      -> neutral   (steel / grey)
 *   QUEUED       -> neutral   (steel / grey)
 *   GATE_REQUIRED -> warning  (safety-orange)
 *   DENIED       -> critical  (ballistic-red)
 *   FAILED       -> critical  (ballistic-red)
 *
 * Risk levels:
 *   LOW          -> healthy
 *   MEDIUM       -> neutral
 *   HIGH         -> warning
 *   CRITICAL     -> critical
 *
 * Constitutional indicators:
 *   SEALED / VALID   -> healthy
 *   DEGRADED / INVALID -> critical
 *   UNKNOWN          -> offline
 */

export type BadgeVariant = "healthy" | "warning" | "critical" | "neutral" | "offline";

/** Run / execution status -> badge variant */
export function statusVariant(status: string): BadgeVariant {
  switch (status) {
    case "SEALED":
    case "COMPLETED":
      return "healthy";
    case "DENIED":
    case "FAILED":
      return "critical";
    case "GATE_REQUIRED":
      return "warning";
    case "RUNNING":
    case "QUEUED":
    default:
      return "neutral";
  }
}

/** Risk level -> badge variant */
export function riskVariant(risk: string): BadgeVariant {
  switch (risk) {
    case "LOW":
      return "healthy";
    case "MEDIUM":
      return "neutral";
    case "HIGH":
      return "warning";
    case "CRITICAL":
      return "critical";
    default:
      return "neutral";
  }
}

/** Constitutional integrity indicator -> badge variant */
export function constitutionalVariant(value: string): BadgeVariant {
  switch (value) {
    case "SEALED":
    case "VALID":
      return "healthy";
    case "DEGRADED":
    case "INVALID":
      return "critical";
    default:
      return "offline";
  }
}

/** Incident flag -> badge variant */
export function incidentVariant(flag: boolean): BadgeVariant {
  return flag ? "critical" : "healthy";
}

/** Seal status -> badge variant */
export function sealVariant(status: string): BadgeVariant {
  switch (status) {
    case "SEALED":
    case "VERIFIED":
      return "healthy";
    case "PENDING":
      return "warning";
    case "INVALID":
    case "BROKEN":
      return "critical";
    default:
      return "neutral";
  }
}

/** Legal hold status -> badge variant */
export function holdVariant(status: string): BadgeVariant {
  switch (status) {
    case "ACTIVE":
      return "warning";
    case "RELEASED":
      return "healthy";
    default:
      return "neutral";
  }
}

/**
 * Constitutional indicator tooltip definitions.
 * Used by the Pulse view and any surface rendering integrity indicators.
 */
export const CONSTITUTIONAL_TOOLTIPS = {
  DETERMINISM:
    "All execution paths are policy-deterministic and reproducible. " +
    "SEALED means every run outcome can be independently verified.",
  SEAL_VALIDATION:
    "Evidence and receipts pass cryptographic verification. " +
    "VALID means no tampered or missing seals detected.",
  INCIDENT_FLAG:
    "Governance integrity incident monitor. " +
    "CLEAR means no active constitutional violations or anomalies.",
} as const;
