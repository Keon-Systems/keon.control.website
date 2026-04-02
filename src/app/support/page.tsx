"use client";

import * as React from "react";
import Link from "next/link";
import { PageContainer, PageHeader, Card, CardHeader, CardContent } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Ticket, TrendingDown, ArrowRight } from "lucide-react";

const SECTIONS = [
  {
    title: "Support Queue",
    description: "Active tickets from all tenants",
    href: "/support/queue",
    icon: <Ticket className="h-6 w-6 text-[#66FCF1]" />,
  },
  {
    title: "Churn Risk",
    description: "At-risk tenants and intervention signals",
    href: "/support/churn-risk",
    icon: <TrendingDown className="h-6 w-6 text-orange-400" />,
  },
];

export default function SupportHubPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Support Hub"
        description="Tenant support queue, churn risk signals, and intervention tools"
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {SECTIONS.map((section) => (
          <Card key={section.href} className="transition-colors hover:border-[#66FCF1]/30">
            <CardHeader
              title={section.title}
              description={section.description}
              actions={section.icon}
            />
            <CardContent>
              <Button variant="outline" className="w-full gap-2" asChild>
                <Link href={section.href}>
                  Open {section.title}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
