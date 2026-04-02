"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  PageContainer,
  PageHeader,
  Card,
  CardHeader,
  CardContent,
} from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Search, ArrowRight } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  status: string;
  plan?: string;
  seatCount?: number;
}

type StatusFilter = "all" | "active" | "inactive" | "suspended" | "trial";
type PlanFilter = "all" | "starter" | "business" | "enterprise" | "growth" | "scale";

function statusVariant(status: string): "healthy" | "warning" | "critical" | "default" {
  switch (status) {
    case "active": return "healthy";
    case "trial": return "warning";
    case "suspended": return "critical";
    default: return "default";
  }
}

function planVariant(plan: string | undefined): "healthy" | "warning" | "default" {
  switch (plan) {
    case "enterprise": return "healthy";
    case "business": case "growth": case "scale": return "warning";
    default: return "default";
  }
}

const STATUS_FILTERS: StatusFilter[] = ["all", "active", "inactive", "suspended", "trial"];
const PLAN_FILTERS: PlanFilter[] = ["all", "starter", "business", "growth", "scale", "enterprise"];

export default function TenantsPage() {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [planFilter, setPlanFilter] = React.useState<PlanFilter>("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const res = await fetch("/api/tenants");
      if (!res.ok) throw new Error("Failed to load tenants");
      const json = await res.json() as { data?: Tenant[]; status?: string };
      // governance-api returns { mode, generatedAt, governance, data, source }
      if (Array.isArray(json)) return json as Tenant[];
      if (json.data && Array.isArray(json.data)) return json.data as Tenant[];
      return [] as Tenant[];
    },
  });

  const tenants: Tenant[] = data ?? [];

  const filtered = tenants.filter((t) => {
    const matchesSearch =
      search === "" ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    const matchesPlan = planFilter === "all" || t.plan === planFilter;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  return (
    <PageContainer>
      <PageHeader
        title="Tenants"
        description="Manage organization tenants and their governance configuration"
        actions={
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Tenant
          </Button>
        }
      />

      {/* Search + filters */}
      <div className="mt-6 space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C5C6C7] opacity-40" />
          <input
            type="text"
            placeholder="Search by name or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded border border-[#384656] bg-[#1F2833] py-2 pl-9 pr-4 font-mono text-sm text-[#C5C6C7] placeholder-[#C5C6C7]/40 focus:border-[#66FCF1]/50 focus:outline-none"
          />
        </div>

        {/* Status chips */}
        <div className="flex flex-wrap gap-2">
          <span className="font-mono text-xs text-[#C5C6C7] opacity-50 self-center">Status:</span>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded border px-2.5 py-0.5 font-mono text-xs uppercase transition-colors ${
                statusFilter === s
                  ? "border-[#66FCF1] text-[#66FCF1]"
                  : "border-[#384656] text-[#C5C6C7] opacity-60 hover:opacity-100"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Plan chips */}
        <div className="flex flex-wrap gap-2">
          <span className="font-mono text-xs text-[#C5C6C7] opacity-50 self-center">Plan:</span>
          {PLAN_FILTERS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlanFilter(p)}
              className={`rounded border px-2.5 py-0.5 font-mono text-xs uppercase transition-colors ${
                planFilter === p
                  ? "border-[#66FCF1] text-[#66FCF1]"
                  : "border-[#384656] text-[#C5C6C7] opacity-60 hover:opacity-100"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[#66FCF1]" />
          <span className="font-mono text-sm text-[#C5C6C7] opacity-60">Loading tenants…</span>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="mt-8 rounded border border-red-500/30 bg-red-900/10 p-4">
          <p className="font-mono text-sm text-red-400">Governance service unavailable. Showing cached data.</p>
        </div>
      )}

      {/* Tenants Grid */}
      {!isLoading && (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center">
              <p className="font-mono text-sm text-[#C5C6C7] opacity-50">
                No tenants match the current filters.
              </p>
            </div>
          ) : (
            filtered.map((tenant) => (
              <Card
                key={tenant.id}
                className="group transition-colors hover:border-[#66FCF1]/30"
              >
                <CardHeader
                  title={tenant.name}
                  description={
                    <span className="font-mono text-xs text-[#C5C6C7] opacity-60">
                      {tenant.id}
                    </span>
                  }
                  actions={
                    <Badge
                      variant={statusVariant(tenant.status)}
                      className="uppercase"
                    >
                      {tenant.status}
                    </Badge>
                  }
                />
                <CardContent>
                  <div className="space-y-3">
                    {tenant.plan && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#C5C6C7] opacity-60">Plan</span>
                        <Badge variant={planVariant(tenant.plan)} className="uppercase">
                          {tenant.plan}
                        </Badge>
                      </div>
                    )}
                    {tenant.seatCount !== undefined && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#C5C6C7] opacity-60">Seats</span>
                        <span className="font-mono text-[#C5C6C7]">{tenant.seatCount}</span>
                      </div>
                    )}
                    <div className="border-t border-[#384656] pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                        asChild
                      >
                        <Link href={`/tenants/${tenant.id}`}>
                          Open Workspace
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Detail tenants quick links (from Agent 2 mock data) */}
      {!isLoading && (
        <div className="mt-8">
          <h2 className="font-['Rajdhani'] text-lg font-semibold text-[#C5C6C7] opacity-70 mb-3">
            Detailed Workspaces
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {["tenant-acme", "tenant-globex", "tenant-initech"].map((id) => (
              <Link
                key={id}
                href={`/tenants/${id}`}
                className="flex items-center justify-between rounded border border-[#384656] p-3 text-sm text-[#C5C6C7] transition-colors hover:border-[#66FCF1]/40 hover:text-[#66FCF1]"
              >
                <span className="font-mono">{id}</span>
                <ArrowRight className="h-4 w-4 opacity-50" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
