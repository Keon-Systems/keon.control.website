"use client";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer, PageHeader, Card, CardHeader, CardContent } from "@/components/layout/page-container";
import { TemplatePicker } from "@/components/communications";
import { AlertCircle } from "lucide-react";

type GovernanceEnvelope = { data: Record<string, unknown>[] };

export default function TemplatesPage() {
  const { data, isLoading, error } = useQuery<GovernanceEnvelope>({
    queryKey: ["communications", "templates"],
    queryFn: async () => {
      const res = await fetch("/api/communications/templates");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    staleTime: 60_000,
  });

  return (
    <PageContainer>
      <PageHeader
        title="Templates"
        description="Reusable message templates for tenant communications"
      />
      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded border border-[#384656] bg-[#1F2833]" />
          ))}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span className="font-mono text-sm">Failed to load templates</span>
        </div>
      )}
      {data && (
        <Card>
          <CardHeader
            title="Available Templates"
            description={`${data.data.length} template${data.data.length !== 1 ? "s" : ""}`}
          />
          <CardContent>
            <TemplatePicker
              templates={
                data.data as Array<{
                  templateId: string;
                  name: string;
                  description?: string;
                  channel?: string;
                  variables?: string[];
                }>
              }
            />
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
