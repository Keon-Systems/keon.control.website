"use client";

import Link from "next/link";
import { Shell } from "@/components/layout";
import { Card, CardContent, CardHeader, PageContainer, PageHeader } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";

export default function BillingCancelPage() {
  return (
    <Shell>
      <PageContainer>
        <PageHeader
          title="Checkout canceled"
          description="No subscription mutation should be assumed from a canceled checkout return."
        />
        <Card>
          <CardHeader title="Nothing changed yet" description="You can return to subscription management and try again when ready." />
          <CardContent className="space-y-3 text-sm text-[#C5C6C7]">
            <p>Billing state remains authoritative in the control plane. If no webhook completed, your plan stays unchanged.</p>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/admin/subscription">Back to subscription</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/get-started">Return to onboarding</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    </Shell>
  );
}
