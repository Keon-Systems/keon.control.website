"use client";

import { LegitimacyAssessmentPanel } from "@/components/collective/legitimacy-assessment-panel";
import { LegitimacyRadar } from "@/components/collective/legitimacy-radar";
import type { ReformLegitimacyAssessment } from "@/lib/contracts/collective";
import { toUILegitimacyAssessment } from "@/lib/mappers/collective";
import { useQuery } from "@tanstack/react-query";

interface LegitimacyDetailClientProps {
  readonly artifactId: string;
}

async function fetchAssessments(
  artifactId: string,
): Promise<ReformLegitimacyAssessment[]> {
  const res = await fetch(
    `/api/collective/legitimacy?artifactRef=${encodeURIComponent(artifactId)}`,
  );
  if (!res.ok) throw new Error("Failed to fetch legitimacy assessments");
  const envelope = await res.json();
  return envelope.data[0]?.items ?? [];
}

export function LegitimacyDetailClient({ artifactId }: LegitimacyDetailClientProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["collective", "legitimacy", artifactId],
    queryFn: () => fetchAssessments(artifactId),
  });

  if (isLoading) {
    return <p className="p-6 text-[#C5C6C7]/50">Loading legitimacy assessment...</p>;
  }
  if (error || !data) {
    return <p className="p-6 text-red-500">Failed to load legitimacy assessment</p>;
  }

  if (data.length === 0) {
    return (
      <p className="p-6 text-[#C5C6C7]/50 italic">
        No legitimacy assessment found for this reform artifact.
      </p>
    );
  }

  // Use the first assessment for this artifact
  const raw = data[0];
  const assessment = toUILegitimacyAssessment(raw);
  const lineageAnchors = raw.lineageAnchors ?? [];

  return (
    <div className="p-6 space-y-8">
      {/* Radar chart */}
      <div className="flex justify-center">
        <LegitimacyRadar dimensions={assessment.dimensions} />
      </div>

      {/* Assessment panel with lineage anchors prominently displayed */}
      <LegitimacyAssessmentPanel
        assessment={assessment}
        lineageAnchors={lineageAnchors}
      />
    </div>
  );
}
