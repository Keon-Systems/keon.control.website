"use client";

/**
 * Execution Theater — Zone 3 (Center)
 *
 * flex-1. The operator's main scanning surface.
 * Composes: ModeSelector + FilterBar + TheaterContent + DepthDrawer.
 *
 * Zero logic. Pure composition.
 */

import { useFocusDepth } from "@/lib/cockpit/use-focus";
import { DepthDrawer } from "./depth-drawer";
import { FilterBar, ModeSelector, TheaterContent } from "./theater";

export function ExecutionTheater() {
  const { isDrawerOpen } = useFocusDepth();

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ModeSelector />
      <FilterBar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TheaterContent />
      </div>
      {isDrawerOpen && <DepthDrawer />}
    </div>
  );
}

