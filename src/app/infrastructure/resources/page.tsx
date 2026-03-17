"use client";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer, PageHeader, Card, CardHeader, CardContent } from "@/components/layout/page-container";
import { ResourceInventoryTable } from "@/components/infrastructure";
import { AlertCircle } from "lucide-react";

type GovernanceEnvelope = { data: Record<string, unknown>[] };

export default function ResourcesPage() {
  const { data, isLoading, error } = useQuery<GovernanceEnvelope>({
    queryKey: ["infrastructure", "resources", "list"],
    queryFn: async () => {
      const res = await fetch("/api/infrastructure/resources");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    staleTime: 60_000,
  });

  return (
    <PageContainer>
      <PageHeader
        title="Resource Inventory"
        description="All Azure resources across resource groups"
      />
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded border border-[#384656] bg-[#1F2833]" />
          ))}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span className="font-mono text-sm">Failed to load resources</span>
        </div>
      )}
      {data && (
        <Card>
          <CardHeader
            title="Azure Resources"
            description={`${data.data.length} resource${data.data.length !== 1 ? "s" : ""} tracked`}
          />
          <CardContent>
            <ResourceInventoryTable
              resources={
                data.data as Array<{
                  resourceId: string;
                  name: string;
                  type: string;
                  resourceGroup: string;
                  location: string;
                  status: string;
                  monthlyCost?: number;
                  monthlyCostUsd?: number;
                }>
              }
            />
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
