"use client";

import Link from "next/link";
import { Shell } from "@/components/layout";
import { Card, CardContent, CardHeader, PageContainer, PageHeader } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";

export default function ControlPage() {
  return (
    <Shell>
      <PageContainer>
        <PageHeader
          title="Operational overview"
          description="Monitor active requests, recent decisions, and workspace posture."
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_360px]">
          <div className="space-y-6">
            <Card>
              <CardContent className="py-12 text-center">
                <div className="font-display text-2xl font-semibold text-[#F3F5F7]">No activity yet.</div>
                <p className="mt-3 text-sm leading-6 text-[#C5C6C7] opacity-80">
                  Governance requests will appear here once your first integration starts routing actions through Keon.
                </p>
                <Button asChild variant="secondary" size="sm" className="mt-6">
                  <Link href="/integrations">Open integrations</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader title="Reality Plane" description="What Keon currently observes." />
              <CardContent className="space-y-3 font-mono text-sm text-[#C5C6C7]">
                <div>Runtime activity: none</div>
                <div>Recent decisions: none</div>
                <div>Receipts: none</div>
                <div>Integration signal: not observed</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </Shell>
  );
}
