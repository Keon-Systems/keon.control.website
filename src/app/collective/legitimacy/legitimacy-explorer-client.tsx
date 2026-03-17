"use client";

import { LegitimacyComparisonTable } from "@/components/collective/legitimacy-comparison-table";
import type { ReformLegitimacyAssessment } from "@/lib/contracts/collective";
import { toUILegitimacyAssessment, type UILegitimacyAssessment } from "@/lib/mappers/collective";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

async function fetchAllAssessments(): Promise<ReformLegitimacyAssessment[]> {
  const res = await fetch("/api/collective/legitimacy");
  if (!res.ok) throw new Error("Failed to fetch legitimacy assessments");
  const envelope = await res.json();
  return envelope.data[0]?.items ?? [];
}

export function LegitimacyExplorerClient() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["collective", "legitimacy", "all"],
    queryFn: fetchAllAssessments,
  });

  const assessments: UILegitimacyAssessment[] = useMemo(
    () => (data ?? []).map(toUILegitimacyAssessment),
    [data],
  );

  if (isLoading) {
    return <p className="p-6 text-[#C5C6C7]/50">Loading legitimacy assessments...</p>;
  }
  if (error) {
    return <p className="p-6 text-red-500">Failed to load legitimacy assessments</p>;
  }

  return (
    <div className="p-6">
      <LegitimacyComparisonTable assessments={assessments} />
    </div>
  );
}
