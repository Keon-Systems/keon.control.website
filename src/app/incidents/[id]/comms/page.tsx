"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageContainer, PageHeader, Card, CardContent } from "@/components/layout/page-container";
import { IncidentCommsPanel } from "@/components/incidents";
import { cn } from "@/lib/utils";

const tabs = [
  { key: "overview", label: "Overview", href: (id: string) => `/incidents/${id}` },
  { key: "timeline", label: "Timeline", href: (id: string) => `/incidents/${id}/timeline` },
  { key: "blast-radius", label: "Blast Radius", href: (id: string) => `/incidents/${id}/blast-radius` },
  { key: "comms", label: "Comms", href: (id: string) => `/incidents/${id}/comms` },
];

export default function CommsPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <PageContainer>
      <PageHeader
        title="Communications"
        description={`Incident ${id} — send notifications to stakeholders`}
      />

      {/* Tab Navigation */}
      <div className="mb-6 flex gap-0 border-b border-[#384656]">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href(id)}
            className={cn(
              "border-b-2 px-4 py-2.5 font-mono text-sm transition-colors",
              tab.key === "comms"
                ? "border-[#66FCF1] text-[#66FCF1]"
                : "border-transparent text-[#C5C6C7] opacity-60 hover:opacity-100 hover:text-[#C5C6C7]"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <IncidentCommsPanel incidentId={id} />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
