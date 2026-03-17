import { Badge } from "@/components/ui";

export interface CollectiveStatusHeaderProps {
  readonly activeDeliberations: number;
  readonly totalReformArtifacts: number;
  readonly recentLegitimacyAssessments: number;
}

export function CollectiveStatusHeader({
  activeDeliberations,
  totalReformArtifacts,
  recentLegitimacyAssessments,
}: CollectiveStatusHeaderProps) {
  return (
    <div className="rounded border border-[#384656] bg-[#1F2833] p-4 font-mono">
      <div className="mb-3 text-xs uppercase tracking-wider text-[--steel]">
        Collective Surface Inspection
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded border border-[#384656] bg-[#0B0C10] p-3">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-[--steel]">
            Active Deliberations
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg tabular-nums text-[--flash]">
              {activeDeliberations}
            </span>
            <Badge variant={activeDeliberations > 0 ? "healthy" : "neutral"}>
              {activeDeliberations > 0 ? "ACTIVE" : "NONE"}
            </Badge>
          </div>
        </div>

        <div className="rounded border border-[#384656] bg-[#0B0C10] p-3">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-[--steel]">
            Reform Artifacts
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg tabular-nums text-[--flash]">
              {totalReformArtifacts}
            </span>
            <Badge variant="neutral">TOTAL</Badge>
          </div>
        </div>

        <div className="rounded border border-[#384656] bg-[#0B0C10] p-3">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-[--steel]">
            Legitimacy Assessments
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg tabular-nums text-[--flash]">
              {recentLegitimacyAssessments}
            </span>
            <Badge variant="neutral">RECENT</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
