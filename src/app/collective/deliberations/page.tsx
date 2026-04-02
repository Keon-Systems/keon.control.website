"use client";

import { DeliberationTimeline } from "@/components/collective/deliberation-timeline";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DeliberationSession } from "@/lib/contracts/collective";
import { toUIDeliberationSession } from "@/lib/mappers/collective";
import type { UIDeliberationSession } from "@/lib/mappers/collective";
import { PageHeader } from "@/ui-kit/components/PageHeader";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import * as React from "react";

type StatusFilter = "all" | "active" | "concluded" | "archived";

export default function DeliberationsListPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");

  const { data: sessions, isLoading } = useQuery<UIDeliberationSession[]>({
    queryKey: ["collective-deliberations"],
    queryFn: async () => {
      const res = await fetch("/api/collective/deliberations");
      if (!res.ok) throw new Error("Failed to fetch deliberations");
      const envelope = await res.json();
      const items: DeliberationSession[] = envelope.data?.[0]?.items ?? [];
      return items.map(toUIDeliberationSession);
    },
  });

  const filteredSessions = React.useMemo(() => {
    if (!sessions) return [];
    return sessions.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (
        searchQuery &&
        !s.topic.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !s.id.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [sessions, statusFilter, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-[#0B0C10]">
      <PageHeader
        title="Deliberation Sessions"
        description="Collective cognition deliberation timeline — read-only observer view"
      />

      {/* Filter bar */}
      <div className="px-6 py-4 border-b border-[#384656] flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C5C6C7] opacity-50" />
          <Input
            placeholder="Search by topic or session ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-[#1F2833]/20 border-[#384656] text-sm"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="bg-[#0B0C10] border border-[#384656] rounded px-3 py-2 text-xs font-mono text-[#C5C6C7] focus:border-[#66FCF1]/50 focus:outline-none"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="concluded">Concluded</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6">
          {isLoading ? (
            <div className="font-mono text-xs opacity-40">
              Loading deliberation sessions...
            </div>
          ) : (
            <DeliberationTimeline sessions={filteredSessions} />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
