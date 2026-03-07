"use client";

import * as React from "react";
import { Shell } from "@/components/layout";
import { Card, CardContent, CardHeader, PageContainer, PageHeader } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createCheckoutSession, createPortalSession, getBillingSummary, getMe, getUsageSummary, listControlTenants } from "@/lib/api/control-plane";
import type { BillingSummary, UsageSummary } from "@/lib/api/types";

const planOptions = [
  {
    code: "builder",
    name: "Builder",
    price: "Free",
    summary: "Free-tier provisioning for evaluation and first governed executions.",
  },
  {
    code: "startup",
    name: "Startup",
    price: "$49 / month",
    summary: "Self-serve paid tier for small teams moving into production.",
  },
  {
    code: "growth",
    name: "Growth",
    price: "$299 / month",
    summary: "Higher throughput, retention, and collaboration for production use.",
  },
  {
    code: "enterprise",
    name: "Enterprise",
    price: "Contact sales",
    summary: "Dedicated runtime, procurement support, SSO, and enterprise controls.",
  },
] as const;

export default function SubscriptionPage() {
  const [billing, setBilling] = React.useState<BillingSummary | null>(null);
  const [usage, setUsage] = React.useState<UsageSummary | null>(null);
  const [tenantId, setTenantId] = React.useState<string | null>(null);
  const [roles, setRoles] = React.useState<string[]>([]);
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      const [tenants, me] = await Promise.all([listControlTenants(), getMe()]);
      if (!tenants[0]) {
        return;
      }

      const tenantId = tenants[0].id;
      setTenantId(tenantId);
      setRoles(me.roles);
      const [billingSummary, usageSummary] = await Promise.all([
        getBillingSummary(tenantId),
        getUsageSummary(tenantId),
      ]);

      setBilling(billingSummary);
      setUsage(usageSummary);
    }

    load().catch(() => {
      setBilling(null);
      setUsage(null);
    });
  }, []);

  const canManageBilling = roles.some((role) => role === "owner" || role === "admin" || role === "billing");

  async function openCheckout(planCode: "builder" | "startup" | "growth" | "enterprise") {
    if (!tenantId || planCode === "enterprise") {
      return;
    }

    setPendingAction(`checkout:${planCode}`);
    setActionError(null);

    try {
      const origin = window.location.origin;
      const session = await createCheckoutSession({
        tenantId,
        planCode,
        successUrl: `${origin}/billing/success`,
        cancelUrl: `${origin}/billing/cancel`,
      });
      window.location.assign(session.checkout_url);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Checkout session failed");
      setPendingAction(null);
    }
  }

  async function openPortal() {
    if (!tenantId) {
      return;
    }

    setPendingAction("portal");
    setActionError(null);

    try {
      const session = await createPortalSession({
        tenantId,
        returnUrl: `${window.location.origin}/admin/subscription`,
      });
      window.location.assign(session.portal_url);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Portal session failed");
      setPendingAction(null);
    }
  }

  return (
    <Shell>
      <PageContainer>
        <PageHeader
          title="Admin > Subscription"
          description="The permanent customer home for plan state, billing visibility, invoices, payment methods, and self-serve upgrade or downgrade decisions."
          actions={
            <>
              <Button variant="secondary" onClick={openPortal} disabled={!canManageBilling || pendingAction !== null}>
                {pendingAction === "portal" ? "Opening..." : "Open billing portal"}
              </Button>
              <Button
                onClick={() => openCheckout("startup")}
                disabled={!canManageBilling || pendingAction !== null}
              >
                {pendingAction === "checkout:startup" ? "Redirecting..." : "Upgrade plan"}
              </Button>
            </>
          }
        />

        {actionError ? (
          <Card className="mb-6 border-[#FF6B6B]/30">
            <CardContent className="text-sm text-[#FF6B6B]">{actionError}</CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
          <Card>
            <CardHeader
              title="Current subscription"
              description="Internal billing projection is authoritative for product enforcement."
              actions={<Badge variant="healthy">{billing?.billingState ?? "loading"}</Badge>}
            />
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded border border-[#384656] bg-[#0B0C10] p-4 font-mono text-sm text-[#C5C6C7]">
                <div>Plan: {billing?.planName ?? "Loading"}</div>
                <div>Period start: {billing?.billingPeriodStartUtc ?? "Loading"}</div>
                <div>Period end: {billing?.billingPeriodEndUtc ?? "Loading"}</div>
                <div>Monthly price: {billing ? `$${billing.monthlyPriceUsd.toFixed(2)}` : "Loading"}</div>
              </div>
              <div className="rounded border border-[#384656] bg-[#0B0C10] p-4 font-mono text-sm text-[#C5C6C7]">
                <div>Included governed executions: {billing?.includedExecutions.toLocaleString() ?? "Loading"}</div>
                <div>Current usage: {usage?.totalQuotaConsumed.toLocaleString() ?? "Loading"}</div>
                <div>Estimated overage: {billing ? `$${billing.estimatedOverageUsd.toFixed(2)}` : "Loading"}</div>
                <div>Authorized executions: {usage?.authorizedExecutions.toLocaleString() ?? "Loading"}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Billing actions"
              description="These entry points originate from control and should back onto checkout or portal session APIs."
            />
            <CardContent className="space-y-3">
              <div className="rounded border border-[#384656] bg-[#0B0C10] p-4 text-sm leading-6 text-[#C5C6C7]">
                Upgrade or add-on selections should create `POST /v1/billing/checkout-session`.
              </div>
              <div className="rounded border border-[#384656] bg-[#0B0C10] p-4 text-sm leading-6 text-[#C5C6C7]">
                Invoice history and payment method changes should create `POST /v1/billing/portal-session`.
              </div>
              <div className="rounded border border-[#384656] bg-[#0B0C10] p-4 text-sm leading-6 text-[#C5C6C7]">
                Enterprise-only items stay visible here, but upgrade paths should gate on role and plan.
              </div>
              <div className="rounded border border-[#384656] bg-[#0B0C10] p-4 text-sm leading-6 text-[#C5C6C7]">
                Active roles: {roles.length ? roles.join(", ") : "loading"}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Available plan changes"
              description="Self-serve tiers stay visible alongside enterprise escalation."
            />
            <CardContent className="space-y-3">
              {planOptions.map((plan) => {
                const isCurrent = billing?.planCode === plan.code;

                return (
                  <div key={plan.code} className="rounded border border-[#384656] bg-[#0B0C10] p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="font-['Rajdhani'] text-xl font-semibold text-[#EAEAEA]">{plan.name}</div>
                      <div className="flex items-center gap-2">
                        {isCurrent ? <Badge variant="healthy">Current</Badge> : null}
                        <span className="font-mono text-xs uppercase tracking-[0.16em] text-[#66FCF1]">{plan.price}</span>
                      </div>
                    </div>
                    <p className="mb-3 text-sm leading-6 text-[#C5C6C7]">{plan.summary}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={isCurrent ? "secondary" : "primary"}
                        onClick={() => (plan.code === "enterprise" ? undefined : openCheckout(plan.code))}
                        disabled={!canManageBilling || pendingAction !== null || isCurrent}
                      >
                        {plan.code === "enterprise"
                          ? "Contact sales"
                          : isCurrent
                            ? "Current plan"
                            : pendingAction === `checkout:${plan.code}`
                              ? "Redirecting..."
                              : "Select plan"}
                      </Button>
                      {plan.code === "enterprise" ? (
                        <Button size="sm" variant="secondary" disabled>
                          Sales path
                        </Button>
                      ) : !isCurrent ? (
                        <Button size="sm" variant="secondary">
                          Review change
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Role-gated administration"
              description="Billing and subscription mutations should be restricted to owner, admin, and billing roles."
            />
            <CardContent className="space-y-3 text-sm leading-6 text-[#C5C6C7]">
              <div className="rounded border border-[#384656] bg-[#0B0C10] p-4">
                Owners and billing admins can initiate checkout, portal, upgrade, downgrade, and cancellation actions.
              </div>
              <div className="rounded border border-[#384656] bg-[#0B0C10] p-4">
                Developers and viewers may see plan context, usage, and billing state but should not mutate subscription state.
              </div>
              <div className="rounded border border-[#384656] bg-[#0B0C10] p-4">
                Webhook-driven state changes must reconcile back into this page deterministically and auditable events should be retained.
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </Shell>
  );
}
