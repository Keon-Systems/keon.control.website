"use client";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { AuditLogTable } from "@/components/audit";
import { AlertCircle, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type GovernanceEnvelope = { data: Record<string, unknown>[] };

const PRIVILEGE_LEVELS = ["elevated", "operator", "admin"] as const;
type PrivilegeLevel = (typeof PRIVILEGE_LEVELS)[number];

export default function AuditPage() {
  const [search, setSearch] = React.useState("");
  const [privilegeFilter, setPrivilegeFilter] = React.useState<PrivilegeLevel | null>(null);

  const { data, isLoading, error } = useQuery<GovernanceEnvelope>({
    queryKey: ["audit"],
    queryFn: async () => {
      const res = await fetch("/api/audit");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    staleTime: 60_000,
  });

  const entries = (data?.data ?? []) as unknown as {
    entryId: string;
    actorId: string;
    actorDisplay: string;
    action: string;
    target: string;
    privilegeLevel: "operator" | "elevated" | "admin";
    timestamp: string;
    receiptId?: string;
    rationale?: string;
  }[];

  return (
    <PageContainer>
      <PageHeader
        title="Audit Log"
        description="Privileged operator action history"
      />

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#384656]" />
          <input
            type="text"
            placeholder="Search actor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded border border-[#384656] bg-[#0B0C10] py-2 pl-9 pr-3 font-mono text-sm text-[#C5C6C7] placeholder-[#384656] focus:border-[#66FCF1] focus:outline-none"
          />
        </div>

        {/* Privilege filter chips */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPrivilegeFilter(null)}
            className={cn(
              "rounded px-3 py-1.5 font-mono text-xs transition-colors border",
              privilegeFilter === null
                ? "border-[#66FCF1] bg-[#1F2833] text-[#66FCF1]"
                : "border-[#384656] bg-[#0B0C10] text-[#C5C6C7] opacity-60 hover:opacity-100"
            )}
          >
            all
          </button>
          {PRIVILEGE_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => setPrivilegeFilter(privilegeFilter === level ? null : level)}
              className={cn(
                "rounded px-3 py-1.5 font-mono text-xs transition-colors border",
                privilegeFilter === level
                  ? level === "admin"
                    ? "border-red-600 bg-red-950 text-red-400"
                    : level === "elevated"
                      ? "border-amber-600 bg-amber-950 text-amber-400"
                      : "border-[#66FCF1] bg-[#1F2833] text-[#66FCF1]"
                  : "border-[#384656] bg-[#0B0C10] text-[#C5C6C7] opacity-60 hover:opacity-100"
              )}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded border border-[#384656] bg-[#1F2833]" />
          ))}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span className="font-mono text-sm">Failed to load audit log</span>
        </div>
      )}
      {!isLoading && !error && (
        <AuditLogTable
          entries={entries}
          search={search}
          privilegeFilter={privilegeFilter}
        />
      )}
    </PageContainer>
  );
}
