/**
 * Keon Control — Incidents Adapter
 *
 * Normalizes incident data into the IncidentRow shape consumed by IncidentsMode.
 *
 * Real source: Not yet available in backend.
 * On failure: returns mock fallback with error metadata.
 *
 * Truthfulness: When backend provides incidents, the normalizer is ready.
 * Until then, mock data is served with source="mock" explicitly.
 */

import { fetchWithFallback } from "./shared";

// ============================================================
// COCKPIT-FACING SHAPE (matches existing IncidentRow)
// ============================================================

export interface IncidentRow {
  incidentId: string;
  severity: "sev1" | "sev2" | "sev3";
  title: string;
  status: "active" | "mitigated" | "resolved" | "post-mortem";
  declaredAt: string;
  commander: string;
  affectedSystems: string[];
}

// ============================================================
// MOCK FALLBACK
// ============================================================

const MOCK_INCIDENTS: IncidentRow[] = [
  { incidentId: "inc_001", severity: "sev2", title: "Elevated denial rate across agents", status: "active", declaredAt: "2026-03-23T14:00:00.000Z", commander: "ops-lead", affectedSystems: ["runtime", "cortex"] },
  { incidentId: "inc_002", severity: "sev3", title: "Ledger sync degradation", status: "mitigated", declaredAt: "2026-03-23T10:00:00.000Z", commander: "platform-lead", affectedSystems: ["ledger"] },
  { incidentId: "inc_003", severity: "sev1", title: "Complete governance seal failure", status: "resolved", declaredAt: "2026-03-22T08:00:00.000Z", commander: "cto", affectedSystems: ["ledger", "cortex", "collective"] },
  { incidentId: "inc_004", severity: "sev3", title: "Policy evaluation timeout cluster", status: "post-mortem", declaredAt: "2026-03-21T16:00:00.000Z", commander: "ops-lead", affectedSystems: ["collective"] },
];

// ============================================================
// NORMALIZER (ready for real data)
// ============================================================

export interface RawIncident {
  id: string;
  severity: string;
  title: string;
  status: string;
  declaredAt: string;
  commander?: string;
  affectedSystems?: string[];
}

function normalizeSeverity(sev: string): IncidentRow["severity"] {
  if (sev === "sev1" || sev === "SEV1" || sev === "1") return "sev1";
  if (sev === "sev2" || sev === "SEV2" || sev === "2") return "sev2";
  return "sev3";
}

function normalizeStatus(status: string): IncidentRow["status"] {
  const lower = status.toLowerCase();
  if (lower === "active" || lower === "open") return "active";
  if (lower === "mitigated") return "mitigated";
  if (lower === "resolved" || lower === "closed") return "resolved";
  if (lower.includes("post")) return "post-mortem";
  return "active";
}

export function normalizeIncident(raw: RawIncident): IncidentRow {
  return {
    incidentId: raw.id,
    severity: normalizeSeverity(raw.severity),
    title: raw.title,
    status: normalizeStatus(raw.status),
    declaredAt: raw.declaredAt,
    commander: raw.commander ?? "unknown",
    affectedSystems: raw.affectedSystems ?? [],
  };
}

// ============================================================
// PUBLIC ADAPTER
// ============================================================

export async function fetchIncidents(): Promise<{
  rows: IncidentRow[];
  source: "live" | "mock";
  error: string | null;
}> {
  const result = await fetchWithFallback(
    async () => {
      // Backend incidents endpoint is not yet implemented.
      throw new Error("Incidents API endpoint not yet implemented in backend");
    },
    MOCK_INCIDENTS,
  );

  return { rows: result.data, source: result.source, error: result.error };
}

