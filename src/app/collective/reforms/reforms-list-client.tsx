"use client";

import { ReformArtifactCard } from "@/components/collective/reform-artifact-card";
import type { ReformArtifact, ReformLegitimacyAssessment } from "@/lib/contracts/collective";
import { toUIReformArtifactCard, type UIReformArtifactCard } from "@/lib/mappers/collective";
import type { ReformArtifactStatus } from "@/lib/contracts/collective";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface EnvelopeItems<T> {
  data: { items: T[] }[];
}

async function fetchReforms(): Promise<ReformArtifact[]> {
  const res = await fetch("/api/collective/reforms");
  if (!res.ok) throw new Error("Failed to fetch reforms");
  const envelope: EnvelopeItems<ReformArtifact> = await res.json();
  return envelope.data[0]?.items ?? [];
}

async function fetchAssessments(): Promise<ReformLegitimacyAssessment[]> {
  const res = await fetch("/api/collective/legitimacy");
  if (!res.ok) throw new Error("Failed to fetch assessments");
  const envelope: EnvelopeItems<ReformLegitimacyAssessment> = await res.json();
  return envelope.data[0]?.items ?? [];
}

const STATUS_FILTERS: readonly ReformArtifactStatus[] = [
  "hosted",
  "superseded",
  "withdrawn",
];

export function ReformsListClient() {
  const [statusFilter, setStatusFilter] = useState<ReformArtifactStatus | "all">("all");

  const reforms = useQuery({
    queryKey: ["collective", "reforms"],
    queryFn: fetchReforms,
  });

  const assessments = useQuery({
    queryKey: ["collective", "legitimacy"],
    queryFn: fetchAssessments,
  });

  const cards: UIReformArtifactCard[] = useMemo(() => {
    if (!reforms.data) return [];
    const assessmentIds = new Set(
      (assessments.data ?? []).map((a) => a.reformArtifactRef),
    );
    return reforms.data.map((artifact) =>
      toUIReformArtifactCard(artifact, assessmentIds),
    );
  }, [reforms.data, assessments.data]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return cards;
    return cards.filter((c) => c.status === statusFilter);
  }, [cards, statusFilter]);

  if (reforms.isLoading) {
    return <p className="p-6 text-[#C5C6C7]/50">Loading reform artifacts...</p>;
  }
  if (reforms.error) {
    return <p className="p-6 text-red-500">Failed to load reform artifacts</p>;
  }

  return (
    <div className="p-6 space-y-4">
      {/* Status filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#C5C6C7]/50 uppercase tracking-wider">Filter:</span>
        <button
          className={cn(
            "px-2 py-1 text-xs rounded border transition-colors",
            statusFilter === "all"
              ? "border-[#66FCF1] text-[#66FCF1]"
              : "border-[#384656] text-[#C5C6C7]/50 hover:text-[#C5C6C7]",
          )}
          onClick={() => setStatusFilter("all")}
        >
          All
        </button>
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            className={cn(
              "px-2 py-1 text-xs rounded border transition-colors",
              statusFilter === s
                ? "border-[#66FCF1] text-[#66FCF1]"
                : "border-[#384656] text-[#C5C6C7]/50 hover:text-[#C5C6C7]",
            )}
            onClick={() => setStatusFilter(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((artifact) => (
          <ReformArtifactCard key={artifact.id} artifact={artifact} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-xs text-[#C5C6C7]/50 italic">
          No reform artifacts match the current filter.
        </p>
      )}
    </div>
  );
}
