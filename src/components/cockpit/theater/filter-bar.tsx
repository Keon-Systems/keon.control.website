"use client";

/**
 * Filter Bar — Active filter display + clear.
 * Only renders when filters are active.
 */

import { useFilterContext } from "@/lib/cockpit/use-focus";

export function FilterBar() {
  const { filterContext, hasActiveFilters, clearFilters } = useFilterContext();

  if (!hasActiveFilters) return null;

  return (
    <div className="flex h-7 shrink-0 items-center gap-2 border-b border-[#1F2833]/20 px-3">
      <span className="text-[9px] font-mono text-[#C5C6C7]/40">FILTERS:</span>
      {filterContext.status && (
        <span className="text-[9px] font-mono text-[#45A29E] bg-[#45A29E]/5 px-1 rounded">
          status={filterContext.status.join(",")}
        </span>
      )}
      {filterContext.severity && (
        <span className="text-[9px] font-mono text-[#45A29E] bg-[#45A29E]/5 px-1 rounded">
          severity={filterContext.severity.join(",")}
        </span>
      )}
      {filterContext.agent && (
        <span className="text-[9px] font-mono text-[#45A29E] bg-[#45A29E]/5 px-1 rounded">
          agent={filterContext.agent}
        </span>
      )}
      {filterContext.search && (
        <span className="text-[9px] font-mono text-[#45A29E] bg-[#45A29E]/5 px-1 rounded">
          &quot;{filterContext.search}&quot;
        </span>
      )}
      <button
        onClick={clearFilters}
        className="text-[9px] font-mono text-[#E94560]/50 hover:text-[#E94560] ml-auto transition-colors"
      >
        clear
      </button>
    </div>
  );
}

