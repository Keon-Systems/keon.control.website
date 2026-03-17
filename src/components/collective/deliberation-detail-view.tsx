"use client";

import { Badge } from "@/components/ui/badge";
import { formatTimestamp } from "@/lib/format";
import type {
  UIDeliberationSession,
  UIDeliberationRecord,
} from "@/lib/mappers/collective";
import type { DeliberationSummary } from "@/lib/contracts/collective";
import { cn } from "@/lib/utils";
import { Clock, FileText, Filter, Link2, MessageSquare, Users } from "lucide-react";
import * as React from "react";

// ---------------------------------------------------------------------------
// Props (read-only, no callbacks)
// ---------------------------------------------------------------------------

interface DeliberationDetailViewProps {
  session: UIDeliberationSession;
  records: UIDeliberationRecord[];
  summary?: DeliberationSummary;
}

// ---------------------------------------------------------------------------
// Evidence Ref Badge — lightweight RHID display for lineage anchoring
// Reuses the visual language of RhidBadge without requiring manifest entries.
// ---------------------------------------------------------------------------

function EvidenceRefBadge({ rhid }: { rhid: string }) {
  const kind = rhid.split(":")[1] || "unknown";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded",
        "bg-[#384656]/30 border border-[#384656] text-[#C5C6C7] text-[11px] font-mono",
        "hover:border-[#66FCF1]/50 transition-colors cursor-default"
      )}
      title={rhid}
    >
      <FileText className="h-3 w-3 text-[#66FCF1]" />
      <span className="opacity-60 uppercase text-[9px] tracking-wider">{kind}</span>
      <span className="truncate max-w-[180px]">{rhid}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DeliberationDetailView({
  session,
  records,
  summary,
}: DeliberationDetailViewProps) {
  const [contributorFilter, setContributorFilter] = React.useState<string>("");

  // Unique contributors for filter
  const contributors = React.useMemo(
    () => Array.from(new Set(records.map((r) => r.contributorId))).sort(),
    [records]
  );

  const filteredRecords = React.useMemo(
    () =>
      contributorFilter
        ? records.filter((r) => r.contributorId === contributorFilter)
        : records,
    [records, contributorFilter]
  );

  // All evidence refs across records (for the session-level lineage anchor display)
  const allEvidenceRefs = React.useMemo(
    () => Array.from(new Set(records.flatMap((r) => r.evidenceRefs))),
    [records]
  );

  return (
    <div className="flex flex-col gap-6">
      {/* ── Session Header ── */}
      <div className="bg-[#1F2833]/10 border border-[#384656] rounded p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[#66FCF1]" />
              <h2 className="font-mono text-lg font-bold text-[#66FCF1]">
                {session.topic}
              </h2>
            </div>
            <span className="block text-[10px] text-[#C5C6C7] opacity-40 uppercase font-bold tracking-widest">
              Deliberation Session
            </span>
          </div>
          <Badge variant={session.statusBadgeVariant}>
            {session.status.toUpperCase()}
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="block text-[10px] text-[#C5C6C7] opacity-40 uppercase font-bold mb-1">
              Epoch Ref
            </span>
            <span className="font-mono text-xs text-[#C5C6C7]">
              {session.epochRef}
            </span>
          </div>
          <div>
            <span className="block text-[10px] text-[#C5C6C7] opacity-40 uppercase font-bold mb-1">
              Started
            </span>
            <span className="font-mono text-xs text-[#C5C6C7]">
              {formatTimestamp(new Date(session.startedAt))}
            </span>
          </div>
          <div>
            <span className="block text-[10px] text-[#C5C6C7] opacity-40 uppercase font-bold mb-1">
              {session.concludedAt ? "Concluded" : "Duration"}
            </span>
            <span className="font-mono text-xs text-[#C5C6C7]">
              {session.concludedAt
                ? formatTimestamp(new Date(session.concludedAt))
                : session.durationLabel}
            </span>
          </div>
          <div>
            <span className="block text-[10px] text-[#C5C6C7] opacity-40 uppercase font-bold mb-1">
              Participants
            </span>
            <span className="font-mono text-xs text-[#C5C6C7]">
              {session.participantCount}
            </span>
          </div>
        </div>

        {/* ── Lineage Anchors (session-level evidence refs) ── */}
        {allEvidenceRefs.length > 0 && (
          <div className="pt-3 border-t border-[#384656]">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="h-3.5 w-3.5 text-[#66FCF1]" />
              <span className="text-[10px] text-[#66FCF1] uppercase font-bold tracking-wider">
                Lineage Anchors ({allEvidenceRefs.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {allEvidenceRefs.map((ref) => (
                <EvidenceRefBadge key={ref} rhid={ref} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Outcome Disposition (if concluded) ── */}
      {summary && (
        <div className="bg-[#1F2833]/10 border border-[#384656] rounded p-4 space-y-2">
          <span className="text-[10px] text-[#66FCF1] uppercase font-bold tracking-wider">
            Outcome Disposition
          </span>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <span className="block text-[10px] text-[#C5C6C7] opacity-40 uppercase font-bold mb-1">
                Disposition
              </span>
              <span className="font-mono text-sm text-[#C5C6C7]">
                {summary.outcomeDisposition}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-[#C5C6C7] opacity-40 uppercase font-bold mb-1">
                Participants
              </span>
              <span className="font-mono text-sm text-[#C5C6C7]">
                {summary.participantCount}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-[#C5C6C7] opacity-40 uppercase font-bold mb-1">
                Duration
              </span>
              <span className="font-mono text-sm text-[#C5C6C7]">
                {summary.durationMs}ms
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Contributor Filter ── */}
      {contributors.length > 1 && (
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-[#C5C6C7] opacity-50" />
          <span className="text-[10px] text-[#C5C6C7] opacity-40 uppercase font-bold">
            Filter by contributor
          </span>
          <select
            value={contributorFilter}
            onChange={(e) => setContributorFilter(e.target.value)}
            className="ml-2 bg-[#0B0C10] border border-[#384656] rounded px-2 py-1 text-xs font-mono text-[#C5C6C7] focus:border-[#66FCF1]/50 focus:outline-none"
          >
            <option value="">All contributors</option>
            {contributors.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ── Contribution Timeline ── */}
      <div className="flex flex-col">
        {filteredRecords.map((record, idx) => (
          <div
            key={`${record.contributorId}-${record.timestamp}-${idx}`}
            className="group relative flex border-b border-[#384656] p-4 transition-all hover:bg-[#384656]/10"
          >
            {/* Gutter */}
            <div className="mr-4 flex flex-col items-center">
              <span className="font-mono text-[10px] text-[#C5C6C7] opacity-40">
                {(idx + 1).toString().padStart(3, "0")}
              </span>
              <div
                className={cn(
                  "my-2 h-full w-px bg-[#384656]",
                  idx === filteredRecords.length - 1 && "h-0"
                )}
              />
            </div>

            {/* Record content */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3 text-[#66FCF1] opacity-70" />
                  <span className="font-mono text-sm font-bold text-[#66FCF1]">
                    {record.contributorId}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-[#C5C6C7] opacity-40" />
                  <span className="font-mono text-xs text-[#C5C6C7] opacity-60">
                    {formatTimestamp(new Date(record.timestamp))}
                  </span>
                </div>
              </div>

              <div>
                <span className="block text-[10px] text-[#C5C6C7] opacity-40 uppercase font-bold mb-0.5">
                  Position
                </span>
                <p className="text-sm text-[#C5C6C7]">{record.position}</p>
              </div>

              <div>
                <span className="block text-[10px] text-[#C5C6C7] opacity-40 uppercase font-bold mb-0.5">
                  Reasoning
                </span>
                <p className="text-sm text-[#C5C6C7] opacity-80">
                  {record.reasoning}
                </p>
              </div>

              {/* Per-record evidence refs as RHID badges */}
              {record.evidenceRefs.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Link2 className="h-3 w-3 text-[#66FCF1] opacity-60" />
                    <span className="text-[10px] text-[#66FCF1] opacity-70 uppercase font-bold tracking-wider">
                      Evidence Refs ({record.evidenceRefCount})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {record.evidenceRefs.map((ref) => (
                      <EvidenceRefBadge key={ref} rhid={ref} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredRecords.length === 0 && (
          <div className="text-center py-8 border border-dashed border-[#384656] rounded opacity-30">
            No contributions match the current filter.
          </div>
        )}
      </div>
    </div>
  );
}
