"use client";

import { ArtifactInspector } from "@/components/collective/artifact-inspector";
import type { GetReformDetailResponse } from "@/lib/contracts/collective";
import { toUIReformArtifactDetail } from "@/lib/mappers/collective";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

interface ReformDetailClientProps {
  readonly artifactId: string;
}

async function fetchReformDetail(artifactId: string): Promise<GetReformDetailResponse> {
  const res = await fetch(`/api/collective/reforms/${encodeURIComponent(artifactId)}`);
  if (!res.ok) throw new Error("Failed to fetch reform detail");
  const envelope = await res.json();
  return envelope.data[0];
}

export function ReformDetailClient({ artifactId }: ReformDetailClientProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["collective", "reforms", artifactId],
    queryFn: () => fetchReformDetail(artifactId),
  });

  if (isLoading) {
    return <p className="p-6 text-[#C5C6C7]/50">Loading reform artifact...</p>;
  }
  if (error || !data) {
    return <p className="p-6 text-red-500">Failed to load reform artifact</p>;
  }

  const viewModel = toUIReformArtifactDetail(data.artifact, data.lineage);

  return (
    <div className="p-6 space-y-6">
      <ArtifactInspector artifact={viewModel} />

      <div className="flex gap-4 pt-4 border-t border-[#384656]">
        <Link
          href={`/collective/reforms/${artifactId}/legitimacy`}
          className="text-xs font-mono text-[#66FCF1] hover:underline"
        >
          View Legitimacy Assessment
        </Link>
        <Link
          href={`/collective/reforms/${artifactId}/adoption`}
          className="text-xs font-mono text-[#66FCF1] hover:underline"
        >
          View Adoption Decisions
        </Link>
      </div>
    </div>
  );
}
