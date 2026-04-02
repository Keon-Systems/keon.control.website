"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer, PageHeader, Card, CardContent } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Download, RefreshCw, Search, Activity } from "lucide-react";
import { formatTimestamp, formatHash } from "@/lib/format";
import { DataValue } from "@/components/ui/data-value";
import { cn } from "@/lib/utils";

interface TraceEntry {
  traceId: string;
  executionId: string;
  eventType: string;
  correlationId: string;
  timestamp: string;
  severity: "info" | "warning" | "error";
}

interface GovernanceEnvelope {
  data: TraceEntry[];
}

type Severity = "info" | "warning" | "error";

const SEVERITIES: Severity[] = ["info", "warning", "error"];
const PAGE_SIZE = 10;

const severityConfig: Record<Severity, { variant: "default" | "warning" | "critical"; label: string }> = {
  info: { variant: "default", label: "Info" },
  warning: { variant: "warning", label: "Warning" },
  error: { variant: "critical", label: "Error" },
};

const eventTypeConfig: Record<string, { variant: "default" | "healthy" | "critical" }> = {
  "execution.started": { variant: "default" },
  "execution.completed": { variant: "healthy" },
  "execution.failed": { variant: "critical" },
  "policy.evaluated": { variant: "default" },
};

const mockTraces: TraceEntry[] = [
  {
    traceId: "trace_01923e6a46a977f29cba9c9f2f8a8f7c",
    executionId: "exec_01923e6a46a977f29cba9c9f2f8a8f7c",
    eventType: "execution.started",
    correlationId: "t:t-001|c:01923e6a-46a9-77f2-9cba-9c9f2f8a8f7c",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    severity: "info",
  },
  {
    traceId: "trace_01923e6a46a977f29cba9c9f2f8a8f7d",
    executionId: "exec_01923e6a46a977f29cba9c9f2f8a8f7c",
    eventType: "policy.evaluated",
    correlationId: "t:t-001|c:01923e6a-46a9-77f2-9cba-9c9f2f8a8f7c",
    timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    severity: "info",
  },
  {
    traceId: "trace_01923e5b2c8a77f29cba9c9f2f8a8f7e",
    executionId: "exec_01923e5b2c8a77f29cba9c9f2f8a8f7d",
    eventType: "execution.failed",
    correlationId: "t:t-001|c:01923e5b-2c8a-77f2-9cba-9c9f2f8a8f7d",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    severity: "error",
  },
  {
    traceId: "trace_01923e4d1b7a77f29cba9c9f2f8a8f7f",
    executionId: "exec_01923e4d1b7a77f29cba9c9f2f8a8f7e",
    eventType: "execution.completed",
    correlationId: "t:t-001|c:01923e4d-1b7a-77f2-9cba-9c9f2f8a8f7e",
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    severity: "info",
  },
];

export default function TracesPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [severityFilter, setSeverityFilter] = React.useState<Severity | null>(null);
  const [page, setPage] = React.useState(0);

  const { data, isLoading, error, refetch } = useQuery<GovernanceEnvelope>({
    queryKey: ["observability", "traces"],
    queryFn: async () => {
      const res = await fetch("/api/runs");
      if (!res.ok) {
        // Fall back to mock data if endpoint not available
        return { data: mockTraces };
      }
      return res.json();
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const allTraces: TraceEntry[] = data?.data ?? mockTraces;

  const filtered = allTraces.filter((t) => {
    if (severityFilter && t.severity !== severityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.traceId.toLowerCase().includes(q) ||
        t.executionId.toLowerCase().includes(q) ||
        t.correlationId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset to page 0 when filters change
  React.useEffect(() => {
    setPage(0);
  }, [searchQuery, severityFilter]);

  return (
    <PageContainer>
      <PageHeader
        title="Traces"
        description="Observability traces for execution events and system activity"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Search Bar */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C5C6C7] opacity-50" />
            <Input
              placeholder="Search by Trace ID, Execution ID, Correlation ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Severity Filter Chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setSeverityFilter(null)}
          className={cn(
            "rounded border px-3 py-1 font-mono text-xs transition-colors",
            !severityFilter
              ? "border-[#66FCF1] bg-[#66FCF1]/10 text-[#66FCF1]"
              : "border-[#384656] text-[#C5C6C7] hover:border-[#66FCF1]/50"
          )}
        >
          All
        </button>
        {SEVERITIES.map((sev) => (
          <button
            key={sev}
            onClick={() => setSeverityFilter(sev === severityFilter ? null : sev)}
            className={cn(
              "rounded border px-3 py-1 font-mono text-xs uppercase transition-colors",
              severityFilter === sev
                ? "border-[#66FCF1] bg-[#66FCF1]/10 text-[#66FCF1]"
                : "border-[#384656] text-[#C5C6C7] hover:border-[#66FCF1]/50"
            )}
          >
            {sev}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded border border-[#384656] bg-[#1F2833]" />
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded border border-red-500/40 bg-red-500/10 p-4 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span className="font-mono text-sm">Failed to load traces</span>
        </div>
      )}

      {!isLoading && paginated.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 opacity-50">
          <Activity className="mb-4 h-12 w-12 text-[#384656]" />
          <p className="font-mono text-base text-[#C5C6C7]">No traces match the selected filters</p>
        </div>
      )}

      {/* Traces Table */}
      {paginated.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[#384656] bg-[#0B0C10]">
                  <tr>
                    <th className="p-3 text-left font-mono text-xs uppercase tracking-wider text-[#C5C6C7] opacity-60">
                      Timestamp
                    </th>
                    <th className="p-3 text-left font-mono text-xs uppercase tracking-wider text-[#C5C6C7] opacity-60">
                      Event Type
                    </th>
                    <th className="p-3 text-left font-mono text-xs uppercase tracking-wider text-[#C5C6C7] opacity-60">
                      Severity
                    </th>
                    <th className="p-3 text-left font-mono text-xs uppercase tracking-wider text-[#C5C6C7] opacity-60">
                      Trace ID
                    </th>
                    <th className="p-3 text-left font-mono text-xs uppercase tracking-wider text-[#C5C6C7] opacity-60">
                      Execution ID
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#384656]">
                  {paginated.map((trace) => {
                    const severityConf = severityConfig[trace.severity];
                    const eventConf =
                      eventTypeConfig[trace.eventType] ?? { variant: "default" as const };

                    return (
                      <tr
                        key={trace.traceId}
                        className="cursor-pointer transition-colors hover:bg-[#384656]/20"
                      >
                        <td className="p-3">
                          <span className="font-mono text-xs text-[#C5C6C7] opacity-70">
                            {formatTimestamp(new Date(trace.timestamp))}
                          </span>
                        </td>
                        <td className="p-3">
                          <Badge variant={eventConf.variant} className="uppercase">
                            {trace.eventType}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant={severityConf.variant} className="uppercase">
                            {severityConf.label}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <DataValue value={formatHash(trace.traceId)} mono />
                        </td>
                        <td className="p-3">
                          <DataValue value={formatHash(trace.executionId)} mono />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="font-mono text-xs text-[#C5C6C7] opacity-50">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="font-mono text-xs"
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="font-mono text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
