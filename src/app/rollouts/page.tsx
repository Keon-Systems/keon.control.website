"use client";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer, PageHeader, Card, CardHeader, CardContent } from "@/components/layout/page-container";
import { AlertCircle, GitMerge, Flag, Calendar } from "lucide-react";
import Link from "next/link";

type GovernanceEnvelope = { data: Record<string, unknown>[] };

export default function RolloutsPage() {
  const { data: rolloutsData } = useQuery<GovernanceEnvelope>({
    queryKey: ["rollouts", "active"],
    queryFn: async () => {
      const res = await fetch("/api/rollouts/active");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    staleTime: 60_000,
  });

  const activeCount = rolloutsData?.data?.filter(
    (r) => (r as Record<string, unknown>).status === "active"
  ).length ?? 0;

  const links = [
    { href: "/rollouts/active", label: "Active Rollouts", icon: GitMerge, count: activeCount },
    { href: "/rollouts/schedule", label: "Maintenance Windows", icon: Calendar },
    { href: "/rollouts/flags", label: "Feature Flags", icon: Flag },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Rollouts"
        description="Active rollouts, maintenance windows and feature flags"
      />
      <div className="grid gap-4 sm:grid-cols-3">
        {links.map(({ href, label, icon: Icon, count }) => (
          <Link key={href} href={href}>
            <Card hover>
              <CardHeader
                title={
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-[#66FCF1]" />
                    <span className="font-mono text-sm text-[#C5C6C7]">{label}</span>
                  </div>
                }
              />
              {count !== undefined && (
                <CardContent>
                  <p className="font-mono text-2xl font-bold text-[#66FCF1]">{count}</p>
                  <p className="font-mono text-xs text-[#C5C6C7] opacity-50 mt-1">active</p>
                </CardContent>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
