"use client";

/**
 * Keon Control — Cockpit Shell
 *
 * The four-zone constitutional cockpit.
 * Zero logic. Layout + orchestration + keyboard only.
 *
 * Zones:
 *   1. Command Horizon (top, h-12, full-width)
 *   2. Governance Rail (left, w-64)
 *   3. Execution Theater (center, flex-1)
 *   4. Evidence Rail (right, w-80)
 *
 * Overlays:
 *   - Depth Drawer (bottom of theater, verify depth)
 *   - Forensic Overlay (full-screen, forensic depth)
 *
 * Incident mode is sovereign — overrides everything.
 */

import { IncidentShell } from "@/components/incident";
import { CommandPalette } from "@/components/layout/command-palette";
import { useFocus } from "@/lib/cockpit/use-focus";
import { useIncidentMode } from "@/lib/incident-mode";
import * as React from "react";
import { CommandHorizon } from "./command-horizon";
import { EvidenceRail } from "./evidence-rail";
import { ExecutionTheater } from "./execution-theater";
import { ForensicOverlay } from "./forensic-overlay";
import { GovernanceRail } from "./governance-rail";

export function CockpitShell() {
  const { state: incidentState } = useIncidentMode();
  const { state, dispatch, isForensicOpen } = useFocus();
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);

  // ── Incident mode is sovereign ──
  if (incidentState.active) {
    return <IncidentShell><div /></IncidentShell>;
  }

  // ── Shell-level keyboard handler ──
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      // Ctrl+K — Command palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      // Ctrl+/ — Toggle governance rail (future: collapse)
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        return;
      }

      // Escape — Cascading close: forensic → drawer → selection → palette
      if (e.key === "Escape") {
        e.preventDefault();
        if (commandPaletteOpen) {
          setCommandPaletteOpen(false);
        } else if (state.inspectionDepth === "forensic") {
          dispatch({ type: "SET_DEPTH", payload: "verify" });
        } else if (state.inspectionDepth === "verify") {
          dispatch({ type: "SET_DEPTH", payload: "inspect" });
        } else if (state.selection) {
          dispatch({ type: "CLEAR_SELECTION" });
        }
        return;
      }

      // v — Toggle verify depth
      if (e.key === "v" && !e.metaKey && !e.ctrlKey) {
        if (state.selection) {
          const next = state.inspectionDepth === "verify" ? "inspect" : "verify";
          dispatch({ type: "SET_DEPTH", payload: next });
        }
        return;
      }

      // f — Toggle forensic overlay
      if (e.key === "f" && !e.metaKey && !e.ctrlKey) {
        if (state.selection) {
          const next = state.inspectionDepth === "forensic" ? "verify" : "forensic";
          dispatch({ type: "SET_DEPTH", payload: next });
        }
        return;
      }

      // t — Toggle live/historical
      if (e.key === "t" && !e.metaKey && !e.ctrlKey) {
        const newMode = state.timeContext.mode === "live" ? "historical" : "live";
        dispatch({
          type: "SET_TIME_CONTEXT",
          payload: {
            mode: newMode,
            timestamp: newMode === "historical" ? new Date().toISOString() : null,
            window: null,
          },
        });
        return;
      }

      // Backspace — Pop mode stack
      if (e.key === "Backspace") {
        if (state.modeStack.length > 0) {
          e.preventDefault();
          dispatch({ type: "POP_MODE" });
        }
        return;
      }

      // 1-9 — Mode shortcuts
      const modeKeys: Record<string, string> = {
        "1": "fleet", "2": "executions", "3": "traces",
        "4": "governance-receipts", "5": "governance-decisions",
        "6": "evidence", "7": "policies", "8": "alerts", "9": "incidents",
      };
      if (modeKeys[e.key] && !e.metaKey && !e.ctrlKey) {
        dispatch({ type: "SET_CENTER_MODE", payload: modeKeys[e.key] as any });
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [state, dispatch, commandPaletteOpen]);

  return (
    <div className="relative flex h-screen w-full flex-col bg-[#0B0C10] overflow-hidden">
      {/* Command Palette (existing component) */}
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />

      {/* Forensic Overlay — z-50, full-screen takeover */}
      {isForensicOpen && <ForensicOverlay />}

      {/* Command Horizon — top band */}
      <CommandHorizon onCommandPaletteOpen={() => setCommandPaletteOpen(true)} />

      {/* Three-column body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Governance Rail — left */}
        <GovernanceRail />

        {/* Execution Theater — center */}
        <ExecutionTheater />

        {/* Evidence Rail — right */}
        <EvidenceRail />
      </div>
    </div>
  );
}

