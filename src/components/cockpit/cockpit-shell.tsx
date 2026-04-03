"use client";

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

  if (incidentState.active) {
    return <IncidentShell><div /></IncidentShell>;
  }

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        return;
      }

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

      if (e.key === "v" && !e.metaKey && !e.ctrlKey) {
        if (state.selection) {
          const next = state.inspectionDepth === "verify" ? "inspect" : "verify";
          dispatch({ type: "SET_DEPTH", payload: next });
        }
        return;
      }

      if (e.key === "f" && !e.metaKey && !e.ctrlKey) {
        if (state.selection) {
          const next = state.inspectionDepth === "forensic" ? "verify" : "forensic";
          dispatch({ type: "SET_DEPTH", payload: next });
        }
        return;
      }

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

      if (e.key === "Backspace") {
        if (state.modeStack.length > 0) {
          e.preventDefault();
          dispatch({ type: "POP_MODE" });
        }
        return;
      }

      const modeKeys: Record<string, string> = {
        "1": "fleet",
        "2": "executions",
        "3": "traces",
        "4": "governance-receipts",
        "5": "governance-decisions",
        "6": "evidence",
        "7": "policies",
        "8": "alerts",
        "9": "incidents",
      };

      if (modeKeys[e.key] && !e.metaKey && !e.ctrlKey) {
        dispatch({ type: "SET_CENTER_MODE", payload: modeKeys[e.key] as never });
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen, dispatch, state]);

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-[#0B0C10]">
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
      {isForensicOpen && <ForensicOverlay />}
      <CommandHorizon onCommandPaletteOpen={() => setCommandPaletteOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <GovernanceRail />
        <ExecutionTheater />
        <EvidenceRail />
      </div>
    </div>
  );
}
