"use client";

import type { UILegitimacyAssessment } from "@/lib/mappers/collective";
import { DispositionBadge } from "./disposition-badge";
import { LineageAnchorBadge } from "./lineage-anchor-badge";

interface LegitimacyAssessmentPanelProps {
  readonly assessment: UILegitimacyAssessment;
  readonly lineageAnchors?: readonly string[];
}

export function LegitimacyAssessmentPanel({
  assessment,
  lineageAnchors,
}: LegitimacyAssessmentPanelProps) {
  return (
    <div className="space-y-6">
      {/* Aggregate disposition */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#C5C6C7]/50">
          Aggregate Disposition
        </span>
        <DispositionBadge disposition={assessment.aggregateDisposition} />
      </div>

      {/* Lineage Anchors -- MUST be visibly rendered */}
      {lineageAnchors && lineageAnchors.length > 0 && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#66FCF1] mb-2">
            Lineage Anchors
          </h3>
          <div className="flex flex-wrap gap-2">
            {lineageAnchors.map((rhid) => (
              <LineageAnchorBadge key={rhid} rhid={rhid} />
            ))}
          </div>
        </section>
      )}

      {/* Dimension outcomes */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#C5C6C7]/50 mb-3">
          Dimension Outcomes
        </h3>
        <div className="space-y-3">
          {assessment.dimensions.map((dim) => (
            <div
              key={dim.dimension}
              className="rounded border border-[#384656] bg-[#0B0C10]/40 p-3"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-[#C5C6C7]">
                  {dim.dimensionLabel}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#C5C6C7]">
                    {dim.scorePercent}%
                  </span>
                  <DispositionBadge disposition={dim.disposition} />
                </div>
              </div>
              {/* Score bar */}
              <div className="h-1.5 rounded-full bg-[#384656]/50 mt-2">
                <div
                  className="h-full rounded-full bg-[#66FCF1]/60 transition-all"
                  style={{ width: `${dim.scorePercent}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-[#C5C6C7]/60">{dim.explanation}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Findings */}
      {assessment.findings.length > 0 && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#C5C6C7]/50 mb-2">
            Findings ({assessment.findingCount})
          </h3>
          <ul className="space-y-1">
            {assessment.findings.map((finding, idx) => (
              <li
                key={idx}
                className="text-xs text-[#C5C6C7]/70 pl-3 border-l-2 border-[#384656]"
              >
                {finding}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
