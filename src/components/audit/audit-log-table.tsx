"use client";
import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ClipboardList, ExternalLink } from "lucide-react";

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
      <table className="w-full min-w-[800px] text-sm">
        <thead>
          <tr className="border-b border-[#384656] bg-[#0B0C10]">
            <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Timestamp</th>
            <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Actor</th>
            <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Action</th>
            <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Target</th>
            <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Privilege</th>
            <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Receipt</th>
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
                <td className="px-4 py-3 font-mono text-xs text-[#C5C6C7] opacity-70 whitespace-nowrap">
                  {formatAge(entry.timestamp)}
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-mono text-xs text-[#C5C6C7]">{entry.actorDisplay}</p>
                    <p className="font-mono text-xs text-[#C5C6C7] opacity-40">{entry.actorId}</p>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[#66FCF1]">{entry.action}</td>
                <td className="px-4 py-3 font-mono text-xs text-[#C5C6C7] opacity-70 max-w-[200px] truncate" title={entry.target}>
                  {entry.target}
                </td>
                <td className="px-4 py-3">
                  <span className={cn("rounded px-2 py-0.5 font-mono text-xs", privilegeBadgeClass(pl))}>
                    {pl}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {entry.receiptId ? (
                    <Link
                      href={`/receipts/${entry.receiptId}`}
                      className="flex items-center gap-1 font-mono text-xs text-[#66FCF1] hover:underline"
                    >
                      {entry.receiptId}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : (
                    <span className="font-mono text-xs text-[#C5C6C7] opacity-30">—</span>
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
