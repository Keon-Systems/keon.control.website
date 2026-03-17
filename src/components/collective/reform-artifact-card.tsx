"use client";

import { Badge } from "@/components/ui/badge";
import type { UIReformArtifactCard } from "@/lib/mappers/collective";
import { cn } from "@/lib/utils";
import { Anchor, CheckCircle, FileText } from "lucide-react";
import Link from "next/link";

interface ReformArtifactCardProps {
  readonly artifact: UIReformArtifactCard;
}

export function ReformArtifactCard({ artifact }: ReformArtifactCardProps) {
  return (
    <Link
      href={`/collective/reforms/${artifact.id}`}
      className={cn(
        "block rounded-lg border border-[#384656] bg-[#0B0C10]/60 p-4",
        "hover:border-[#66FCF1]/40 transition-colors",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 text-[#66FCF1] shrink-0" />
          <h3 className="text-sm font-semibold text-[#C5C6C7] truncate">
            {artifact.title}
          </h3>
        </div>
        <Badge variant={artifact.statusBadgeVariant}>{artifact.status}</Badge>
      </div>

      <p className="mt-2 text-xs text-[#C5C6C7]/70 line-clamp-2">
        {artifact.description}
      </p>

      <div className="mt-3 flex items-center gap-4 text-[10px] text-[#C5C6C7]/50 font-mono">
        <span>Author: {artifact.authorId}</span>
        <span>Epoch: {artifact.epochRef}</span>
      </div>

      <div className="mt-2 flex items-center gap-4 text-[10px] text-[#C5C6C7]/50">
        <span>{new Date(artifact.createdAt).toLocaleDateString()}</span>

        <span className="inline-flex items-center gap-1">
          <Anchor className="h-3 w-3" />
          {artifact.lineageAnchorCount} anchor{artifact.lineageAnchorCount !== 1 ? "s" : ""}
        </span>

        {artifact.hasLegitimacyAssessment && (
          <span className="inline-flex items-center gap-1 text-[#66FCF1]">
            <CheckCircle className="h-3 w-3" />
            Legitimacy assessed
          </span>
        )}
      </div>
    </Link>
  );
}
