"use client";

import Link from "next/link";
import { Shell } from "@/components/layout";
import { Card, CardContent, CardHeader, PageContainer, PageHeader } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";

export default function BillingPortalPage() {
  return (
    <Shell>
      <PageContainer>
        <PageHeader
          title="Billing portal"
          description="Control-plane return surface for Stripe billing portal or the local mock portal."
        />
        <Card>
          <CardHeader title="Portal session opened" description="This page handles the post-portal return path for both real Stripe sessions and the local mock fallback." />
          <CardContent className="space-y-3 text-sm text-[#C5C6C7]">
            <p>Use this path to verify authenticated origin, role checks, and return flow wiring from `Admin &gt; Subscription`.</p>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/admin/subscription">Return to subscription</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    </Shell>
  );
}
