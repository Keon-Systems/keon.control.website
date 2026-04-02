"use client";

import type { UILegitimacyAssessment } from "@/lib/mappers/collective";
import { DispositionBadge } from "./disposition-badge";
import { useRouter } from "next/navigation";
import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";

interface LegitimacyComparisonTableProps {
  readonly assessments: readonly UILegitimacyAssessment[];
}

type SortKey = "reform" | "aggregate" | string;
type SortDir = "asc" | "desc";

/**
 * Cross-reform comparison table for the Legitimacy Explorer.
 * Rows: one per assessment. Columns: reform title, each dimension score, aggregate.
 * Sortable by column. Click row navigates to reform detail.
 */
export function LegitimacyComparisonTable({
  assessments,
}: LegitimacyComparisonTableProps) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>("reform");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Collect all unique dimension keys across assessments
  const dimensionKeys = useMemo(() => {
    if (assessments.length === 0) return [];
    // Use the first assessment's dimension order as canonical
    return assessments[0].dimensions.map((d) => d.dimension);
  }, [assessments]);

  const dimensionLabels = useMemo(() => {
    if (assessments.length === 0) return new Map<string, string>();
    const map = new Map<string, string>();
    for (const d of assessments[0].dimensions) {
      map.set(d.dimension, d.dimensionLabel);
    }
    return map;
  }, [assessments]);

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    [sortKey],
  );

  const sorted = useMemo(() => {
    const arr = [...assessments];
    const mul = sortDir === "asc" ? 1 : -1;

    arr.sort((a, b) => {
      if (sortKey === "reform") {
        return mul * a.reformArtifactRef.localeCompare(b.reformArtifactRef);
      }
      if (sortKey === "aggregate") {
        return mul * a.aggregateDisposition.localeCompare(b.aggregateDisposition);
      }
      // Sort by dimension score
      const aScore =
        a.dimensions.find((d) => d.dimension === sortKey)?.score ?? 0;
      const bScore =
        b.dimensions.find((d) => d.dimension === sortKey)?.score ?? 0;
      return mul * (aScore - bScore);
    });

    return arr;
  }, [assessments, sortKey, sortDir]);

  function sortIndicator(key: SortKey) {
    if (sortKey !== key) return null;
    return sortDir === "asc" ? " \u2191" : " \u2193";
  }

  if (assessments.length === 0) {
    return (
      <p className="text-xs text-[#C5C6C7]/50 italic p-4">
        No legitimacy assessments available.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#384656]">
            <th
              className="text-left p-2 text-[#C5C6C7]/50 uppercase tracking-wider cursor-pointer hover:text-[#66FCF1]"
              onClick={() => handleSort("reform")}
            >
              Reform{sortIndicator("reform")}
            </th>
            {dimensionKeys.map((dk) => (
              <th
                key={dk}
                className="text-center p-2 text-[#C5C6C7]/50 uppercase tracking-wider cursor-pointer hover:text-[#66FCF1] whitespace-nowrap"
                onClick={() => handleSort(dk)}
              >
                {dimensionLabels.get(dk) ?? dk}
                {sortIndicator(dk)}
              </th>
            ))}
            <th
              className="text-center p-2 text-[#C5C6C7]/50 uppercase tracking-wider cursor-pointer hover:text-[#66FCF1]"
              onClick={() => handleSort("aggregate")}
            >
              Aggregate{sortIndicator("aggregate")}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((a) => (
            <tr
              key={a.id}
              className={cn(
                "border-b border-[#384656]/50 cursor-pointer",
                "hover:bg-[#384656]/20 transition-colors",
              )}
              onClick={() =>
                router.push(
                  `/collective/reforms/${a.reformArtifactRef}/legitimacy`,
                )
              }
            >
              <td className="p-2 font-mono text-[#C5C6C7]">
                {a.reformArtifactRef}
              </td>
              {dimensionKeys.map((dk) => {
                const dim = a.dimensions.find((d) => d.dimension === dk);
                return (
                  <td key={dk} className="p-2 text-center font-mono text-[#C5C6C7]">
                    {dim ? `${dim.scorePercent}%` : "-"}
                  </td>
                );
              })}
              <td className="p-2 text-center">
                <DispositionBadge disposition={a.aggregateDisposition} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
