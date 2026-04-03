"use client";

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
