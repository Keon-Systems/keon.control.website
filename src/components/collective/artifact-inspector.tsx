"use client";

import { Badge } from "@/components/ui/badge";
import type { UIReformArtifactDetail } from "@/lib/mappers/collective";
import { LineageAnchorBadge } from "./lineage-anchor-badge";
import Link from "next/link";

interface ArtifactInspectorProps {
  readonly artifact: UIReformArtifactDetail;
}

export function ArtifactInspector({ artifact }: ArtifactInspectorProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#C5C6C7]">{artifact.title}</h2>
          <p className="mt-1 text-sm text-[#C5C6C7]/70">{artifact.description}</p>
        </div>
        <Badge variant={artifact.statusBadgeVariant}>{artifact.status}</Badge>
      </div>

      {/* Metadata grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
        <div>
          <span className="text-[#C5C6C7]/50">Author</span>
          <p className="font-mono text-[#C5C6C7]">{artifact.authorId}</p>
        </div>
        <div>
          <span className="text-[#C5C6C7]/50">Epoch</span>
          <p className="font-mono text-[#C5C6C7]">{artifact.epochRef}</p>
        </div>
        <div>
          <span className="text-[#C5C6C7]/50">Created</span>
          <p className="font-mono text-[#C5C6C7]">
            {new Date(artifact.createdAt).toLocaleString()}
          </p>
        </div>
        <div>
          <span className="text-[#C5C6C7]/50">Content Hash (SHA256)</span>
          <p className="font-mono text-[#C5C6C7] break-all text-[11px]">
            {artifact.contentHash}
          </p>
        </div>
      </div>

      {/* Lineage Anchors -- MUST be visibly rendered */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#66FCF1] mb-2">
          Lineage Anchors
        </h3>
        {artifact.lineageAnchors.length === 0 ? (
          <p className="text-xs text-[#C5C6C7]/50 italic">No lineage anchors</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {artifact.lineageAnchors.map((rhid) => (
              <LineageAnchorBadge key={rhid} rhid={rhid} />
            ))}
          </div>
        )}
      </section>

      {/* Evidence Refs */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#66FCF1] mb-2">
          Evidence References
        </h3>
        {artifact.evidenceRefs.length === 0 ? (
          <p className="text-xs text-[#C5C6C7]/50 italic">No evidence references</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {artifact.evidenceRefs.map((rhid) => (
              <LineageAnchorBadge key={rhid} rhid={rhid} />
            ))}
          </div>
        )}
      </section>

      {/* Predecessors */}
      {artifact.predecessors.length > 0 && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#66FCF1] mb-2">
            Predecessors
          </h3>
          <ul className="space-y-1">
            {artifact.predecessors.map((predId) => (
              <li key={predId}>
                <Link
                  href={`/collective/reforms/${predId}`}
                  className="text-xs font-mono text-[#C5C6C7] hover:text-[#66FCF1] transition-colors"
                >
                  {predId}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Deliberation ref */}
      {artifact.deliberationRef && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#66FCF1] mb-2">
            Deliberation Reference
          </h3>
          <span className="text-xs font-mono text-[#C5C6C7]">
            {artifact.deliberationRef}
          </span>
        </section>
      )}
    </div>
  );
}
