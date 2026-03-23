"use client";

/**
 * Keon Control — Selection-Derived Governance Hook
 *
 * Computes governance context specific to the currently selected entity.
 * Includes drift detection (Amendment 4).
 *
 * Returns null when no selection is active.
 *
 * References:
 *   - Section 4.4: Selection-Derived Governance
 *   - Amendment 4: Governance Drift / Conflict Visibility
 */

import { useMemo } from "react";
import { useFocusContext } from "./focus-context";
import { useGovernanceContext } from "./governance-context";
import type { GovernanceDrift, OversightMode, SelectionGovernance } from "./types";

/**
 * Compute governance context for the current selection.
 *
 * In production: API call keyed to
 *   ['cockpit', 'governance', 'selection', selection.kind, selection.id]
 *
 * For now: generates realistic mock data per selection
 * with drift detection for demonstrable cases.
 */
export function useSelectionGovernance(): SelectionGovernance | null {
  const { state: focusState } = useFocusContext();
  const { state: govState } = useGovernanceContext();

  return useMemo(() => {
    if (!focusState.selection) {
      return null;
    }

    const sel = focusState.selection;
    const drift: GovernanceDrift[] = [];

    // --- Derive governance context per anchor type ---

    if (sel.anchorType === "ephemeral") {
      // In-flight: no governance binding yet
      return {
        governingPolicy: null,
        governingAuthority: null,
        oversightModeAtCreation: govState.posture.oversightMode,
        drift,
      };
    }

    if (sel.anchorType === "derived") {
      // Derived: partial governance binding
      return {
        governingPolicy: null,
        governingAuthority: "system",
        oversightModeAtCreation: null,
        drift,
      };
    }

    // --- Anchored: full governance binding (mock) ---

    const govPolicy = {
      policyId: "pol_v2.3.1",
      version: "2.3.1",
      hash: "sha256:pol_abc123def456",
    };

    // Mock: the entity was created under "supervised" mode
    const modeAtCreation: OversightMode = "supervised";

    // Drift: if current oversight mode differs from creation time
    if (govState.posture.oversightMode !== modeAtCreation) {
      drift.push({
        kind: "oversight-mode-shift",
        severity: "warning",
        message: `Oversight mode was '${modeAtCreation}' at creation, now '${govState.posture.oversightMode}'`,
        ref: {
          type: "oversight-mode",
          id: sel.id,
          atEntityTime: modeAtCreation,
          current: govState.posture.oversightMode,
        },
      });
    }

    // Drift: if current policy profile differs from entity's policy
    if (
      govState.posture.activePolicyProfile &&
      govState.posture.activePolicyProfile !== govPolicy.version
    ) {
      drift.push({
        kind: "policy-drift",
        severity: "info",
        message: `Entity governed by policy v${govPolicy.version}, current profile is ${govState.posture.activePolicyProfile}`,
        ref: {
          type: "policy",
          id: govPolicy.policyId,
          atEntityTime: govPolicy.version,
          current: govState.posture.activePolicyProfile,
        },
      });
    }

    // Historical mode drift: flag if viewing past data
    if (focusState.timeContext.mode === "historical" && focusState.timeContext.timestamp) {
      drift.push({
        kind: "retrospective-constraint",
        severity: "info",
        message: `Viewing governance state at ${focusState.timeContext.timestamp}`,
        ref: {
          type: "oversight-mode",
          id: sel.id,
          atEntityTime: focusState.timeContext.timestamp,
          current: new Date().toISOString(),
        },
      });
    }

    return {
      governingPolicy: govPolicy,
      governingAuthority: "operator:admin",
      oversightModeAtCreation: modeAtCreation,
      drift,
    };
  }, [
    focusState.selection,
    focusState.selectionEpoch,
    focusState.timeContext,
    govState.posture,
  ]);
}

/**
 * Check if there are any governance drift signals for the current selection.
 */
export function useHasGovernanceDrift(): boolean {
  const governance = useSelectionGovernance();
  return governance !== null && governance.drift.length > 0;
}

