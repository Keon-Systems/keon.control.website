"use client";

/**
 * Mode Selector — Center theater mode tabs.
 *
 * Renders mode buttons with keyboard shortcut hints.
 * Mode changes go through FocusState — no direct routing.
 */

import { useCenterMode } from "@/lib/cockpit/use-focus";
import type { CenterMode } from "@/lib/cockpit/types";

interface ModeTab {
  mode: CenterMode;
  label: string;
  shortcut: string;
}

const MODE_TABS: ModeTab[] = [
  { mode: "fleet", label: "Fleet", shortcut: "1" },
  { mode: "executions", label: "Executions", shortcut: "2" },
  { mode: "traces", label: "Traces", shortcut: "3" },
  { mode: "governance-receipts", label: "Receipts", shortcut: "4" },
  { mode: "governance-decisions", label: "Decisions", shortcut: "5" },
  { mode: "evidence", label: "Evidence", shortcut: "6" },
  { mode: "policies", label: "Policies", shortcut: "7" },
  { mode: "alerts", label: "Alerts", shortcut: "8" },
  { mode: "incidents", label: "Incidents", shortcut: "9" },
];

export function ModeSelector() {
  const { centerMode, setCenterMode, hasModeHistory, popMode } = useCenterMode();

  return (
    <div className="flex h-9 shrink-0 items-center gap-0.5 border-b border-[#1F2833]/40 px-3 overflow-x-auto scrollbar-none">
      {hasModeHistory && (
        <button
          onClick={popMode}
          className="text-[10px] font-mono text-[#45A29E]/60 hover:text-[#66FCF1] mr-2 shrink-0 transition-colors"
          title="Backspace"
        >
          ← back
        </button>
      )}
      {MODE_TABS.map((tab) => (
        <button
          key={tab.mode}
          onClick={() => setCenterMode(tab.mode)}
          className={`px-2 py-1 text-[10px] font-mono rounded shrink-0 transition-colors ${
            centerMode === tab.mode
              ? "bg-[#1F2833] text-[#66FCF1]"
              : "text-[#C5C6C7]/40 hover:text-[#C5C6C7]/70 hover:bg-[#1F2833]/30"
          }`}
          title={`Press ${tab.shortcut}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

