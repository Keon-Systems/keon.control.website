"use client";
import { cn } from "@/lib/utils";
import { ClipboardList, ExternalLink } from "lucide-react";
import Link from "next/link";

interface AuditEntry {
  entryId: string;
  actorId: string;
  actorDisplay: string;
  action: string;
  target: string;
  privilegeLevel: "operator" | "elevated" | "admin";
  timestamp: string;
  receiptId?: string;
  rationale?: string;
}

interface AuditLogTableProps {
  entries: AuditEntry[];
  search?: string;
  privilegeFilter?: string | null;
}

function privilegeBadgeClass(level: AuditEntry["privilegeLevel"]): string {
  switch (level) {
    case "admin":
      return "bg-red-950 text-red-400 border border-red-800";
    case "elevated":
      return "bg-amber-950 text-amber-400 border border-amber-800";
    case "operator":
    default:
      return "bg-[#1F2833] text-[#C5C6C7] border border-[#384656]";
  }
}

function formatAge(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

function normalizePrivilegeLevel(raw: unknown): AuditEntry["privilegeLevel"] {
  const s = String(raw ?? "").toLowerCase();
  if (s === "admin") return "admin";
  if (s === "elevated") return "elevated";
  return "operator";
}

export function AuditLogTable({ entries, search, privilegeFilter }: AuditLogTableProps) {
  const filtered = entries.filter((entry) => {
    const pl = normalizePrivilegeLevel(entry.privilegeLevel);
    if (privilegeFilter && pl !== privilegeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        entry.actorDisplay.toLowerCase().includes(q) ||
        entry.actorId.toLowerCase().includes(q) ||
        entry.action.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 opacity-50">
        <ClipboardList className="mb-3 h-8 w-8 text-[#384656]" />
        <p className="font-mono text-sm text-[#C5C6C7]">No audit entries match the current filters</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded border border-[#384656]">
      <table className="w-full min-w-[860px] text-sm">
        <thead>
          <tr className="border-b border-[#384656] bg-[#0B0C10]">
            <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wide">Timestamp</th>
            <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wide">Actor</th>
            <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wide">Action</th>
            <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wide">Target</th>
            <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wide">Privilege</th>
            <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wide">Receipt</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((entry) => {
            const pl = normalizePrivilegeLevel(entry.privilegeLevel);
            return (
              <tr
                key={entry.entryId}
                className="border-b border-[#384656] last:border-0 hover:bg-[#1F2833] transition-colors"
              >
                <td className="whitespace-nowrap px-4 py-3.5 font-mono text-[12px] text-[#C5C6C7] opacity-70 sm:text-xs">
                  {formatAge(entry.timestamp)}
                </td>
                <td className="px-4 py-3.5">
                  <div>
                    <p className="font-mono text-[13px] text-[#C5C6C7] sm:text-sm">{entry.actorDisplay}</p>
                    <p className="font-mono text-[12px] text-[#C5C6C7] opacity-40 sm:text-xs">{entry.actorId}</p>
                  </div>
                </td>
                <td className="px-4 py-3.5 font-mono text-[13px] text-[#66FCF1] sm:text-sm">{entry.action}</td>
                <td className="max-w-[280px] px-4 py-3.5 font-mono text-[12px] leading-[1.6] text-[#C5C6C7] opacity-70 break-words sm:text-xs" title={entry.target}>
                  {entry.target}
                </td>
                <td className="px-4 py-3.5">
                  <span className={cn("rounded px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.08em] sm:text-xs", privilegeBadgeClass(pl))}>
                    {pl}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  {entry.receiptId ? (
                    <Link
                      href={`/receipts/${entry.receiptId}`}
                      className="flex items-center gap-1 font-mono text-[12px] text-[#66FCF1] hover:underline sm:text-xs"
                    >
                      {entry.receiptId}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : (
                    <span className="font-mono text-[12px] text-[#C5C6C7] opacity-30 sm:text-xs">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
