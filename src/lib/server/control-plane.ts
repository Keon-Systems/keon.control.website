import Stripe from "stripe";
import type { ApiEnvelope, ApiKeyPreview, BillingSummary, MeResponse, Tenant, UsageSummary } from "@/lib/api/types";
import {
  type BillingProjectionRecord,
  type BillingSessionRecord,
  getBillingProjectionRecord,
  getBillingSessionRecord,
  getMeRecord,
  getUsageSummaryRecord,
  hasWebhookEventRecord,
  isPostgresEnabled,
  listApiKeyRecords,
  listTenantRecords,
  saveBillingSessionRecord,
  saveWebhookEventRecord,
  updateMePlanRecord,
  updateTenantPlanRecord,
  upsertBillingProjectionRecord,
} from "@/lib/server/control-plane-db";
import { getStripeClient, getStripePriceId, getStripeWebhookSecret, isStripeEnabled, planCodeFromPriceId } from "@/lib/server/stripe";

type PlanCode = "builder" | "startup" | "growth" | "enterprise";
type BillingState = "trialing" | "active" | "past_due" | "unpaid" | "canceled" | "suspended";

interface StripeWebhookRecord {
  id: string;
  type: string;
  processedAt: string;
}

interface MemoryState {
  me: MeResponse;
  tenants: Tenant[];
  apiKeys: Record<string, ApiKeyPreview[]>;
  usage: Record<string, UsageSummary>;
  billing: Record<string, BillingProjectionRecord>;
  sessions: Record<string, BillingSessionRecord>;
  webhooks: Record<string, StripeWebhookRecord>;
}

const planCatalog: Record<PlanCode, { name: string; monthlyPriceUsd: number; includedExecutions: number; overageRateUsd: number }> = {
  builder: { name: "Builder", monthlyPriceUsd: 0, includedExecutions: 1_000, overageRateUsd: 0 },
  startup: { name: "Startup", monthlyPriceUsd: 49, includedExecutions: 100_000, overageRateUsd: 0.001 },
  growth: { name: "Growth", monthlyPriceUsd: 299, includedExecutions: 1_000_000, overageRateUsd: 0.0007 },
  enterprise: { name: "Enterprise", monthlyPriceUsd: 0, includedExecutions: 0, overageRateUsd: 0 },
};

function currentBillingWindow() {
  return {
    start: "2026-03-01T00:00:00Z",
    end: "2026-04-01T00:00:00Z",
  };
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeBillingState(status: string | null | undefined): BillingState {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "unpaid":
      return "unpaid";
    case "canceled":
    case "cancelled":
      return "canceled";
    case "incomplete_expired":
    case "paused":
      return "suspended";
    default:
      return "trialing";
  }
}

function stripeId(value: string | { id: string } | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function buildBillingSummary(planCode: PlanCode, usage: UsageSummary, billingState: BillingState): BillingSummary {
  const plan = planCatalog[planCode];
  const overageExecutions = Math.max(0, usage.authorizedExecutions - plan.includedExecutions);

  return {
    planCode,
    planName: plan.name,
    billingState,
    gracePeriodEndsAtUtc: billingState === "past_due" ? "2026-03-15T00:00:00Z" : null,
    monthlyPriceUsd: plan.monthlyPriceUsd,
    includedExecutions: plan.includedExecutions,
    authorizedExecutions: usage.authorizedExecutions,
    deniedExecutions: usage.deniedExecutions,
    overageExecutions,
    estimatedOverageUsd: Number((overageExecutions * plan.overageRateUsd).toFixed(2)),
    billingPeriodStartUtc: currentBillingWindow().start,
    billingPeriodEndUtc: currentBillingWindow().end,
  };
}

function defaultMemoryState(): MemoryState {
  const tenantId = "ten_keon_builder";
  const usage: UsageSummary = {
    tenantId,
    billingPeriodStartUtc: currentBillingWindow().start,
    authorizedExecutions: 423,
    deniedExecutions: 38,
    failedSystemExecutions: 2,
    totalQuotaConsumed: 461,
    daily: [
      { date: "2026-03-01", authorizedExecutions: 42, deniedExecutions: 4, totalExecutions: 46 },
      { date: "2026-03-02", authorizedExecutions: 58, deniedExecutions: 6, totalExecutions: 64 },
      { date: "2026-03-03", authorizedExecutions: 71, deniedExecutions: 8, totalExecutions: 79 },
      { date: "2026-03-04", authorizedExecutions: 101, deniedExecutions: 10, totalExecutions: 111 },
      { date: "2026-03-05", authorizedExecutions: 151, deniedExecutions: 10, totalExecutions: 161 },
    ],
  };

  return {
    me: {
      userId: "usr_clint",
      tenantId,
      tenantName: "Keon Systems",
      planId: "free",
      roles: ["owner", "admin", "billing"],
      operatorModeEnabled: false,
    },
    tenants: [
      {
        id: tenantId,
        name: "Keon Systems",
        status: "active",
        createdAt: "2026-03-01T00:00:00Z",
        slug: "keon-systems",
        currentPlanCode: "builder",
        billingEmail: "billing@keon.systems",
        emailVerified: true,
      },
    ],
    apiKeys: {
      [tenantId]: [
        {
          id: "key_test_001",
          name: "Default Test Key",
          prefix: "test_a1b2",
          mode: "test",
          status: "active",
          environmentId: "env_dev",
          lastUsedAtUtc: "2026-03-05T18:20:00Z",
          lastUsedIp: "127.0.0.1",
          createdAtUtc: "2026-03-01T00:05:00Z",
        },
      ],
    },
    usage: { [tenantId]: usage },
    billing: {
      [tenantId]: {
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        stripePriceId: null,
        summary: buildBillingSummary("builder", usage, "trialing"),
      },
    },
    sessions: {},
    webhooks: {},
  };
}

declare global {
  var __keonControlPlaneMemoryState: MemoryState | undefined;
}

function memoryState() {
  globalThis.__keonControlPlaneMemoryState ??= defaultMemoryState();
  return globalThis.__keonControlPlaneMemoryState;
}

function requestId() {
  return `req_${Math.random().toString(36).slice(2, 10)}`;
}

function sameOriginAbsoluteUrl(path: string) {
  const origin = process.env.NEXT_PUBLIC_APP_ORIGIN || "http://localhost:3000";
  return new URL(path, origin).toString();
}

async function meRecord() {
  return isPostgresEnabled() ? getMeRecord() : memoryState().me;
}

async function tenantRecords() {
  return isPostgresEnabled() ? listTenantRecords() : memoryState().tenants;
}

async function usageRecord(tenantId: string) {
  if (isPostgresEnabled()) return getUsageSummaryRecord(tenantId);
  const usage = memoryState().usage[tenantId];
  if (!usage) throw new Error("Unknown tenant");
  return usage;
}

async function billingProjection(tenantId: string) {
  if (isPostgresEnabled()) return getBillingProjectionRecord(tenantId);
  const projection = memoryState().billing[tenantId];
  if (!projection) throw new Error("Unknown tenant");
  return projection;
}

async function hasBillingRole() {
  const me = await meRecord();
  return me.roles.some((role) => role === "owner" || role === "admin" || role === "billing");
}

async function writeProjection(tenantId: string, planCode: PlanCode, billingState: BillingState, previous: BillingProjectionRecord, refs?: {
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
}) {
  const usage = await usageRecord(tenantId);
  const summary = buildBillingSummary(planCode, usage, billingState);
  const nextProjection: BillingProjectionRecord = {
    stripeCustomerId: refs?.stripeCustomerId ?? previous.stripeCustomerId ?? null,
    stripeSubscriptionId: refs?.stripeSubscriptionId ?? previous.stripeSubscriptionId ?? null,
    stripePriceId: refs?.stripePriceId ?? previous.stripePriceId ?? null,
    summary,
  };

  if (isPostgresEnabled()) {
    await upsertBillingProjectionRecord(tenantId, nextProjection);
    await updateTenantPlanRecord(tenantId, planCode);
    await updateMePlanRecord(planCode === "builder" ? "free" : planCode);
    return nextProjection;
  }

  const state = memoryState();
  const tenant = state.tenants.find((item) => item.id === tenantId);
  if (!tenant) throw new Error("Unknown tenant");
  tenant.currentPlanCode = planCode;
  state.me.planId = planCode === "builder" ? "free" : planCode;
  state.billing[tenantId] = nextProjection;
  return nextProjection;
}

async function ensureStripeCustomer(tenantId: string) {
  if (!isStripeEnabled()) return null;

  const [tenant, projection] = await Promise.all([
    tenantRecords().then((rows) => rows.find((item) => item.id === tenantId)),
    billingProjection(tenantId),
  ]);
  if (!tenant) throw new Error("Unknown tenant");
  if (projection.stripeCustomerId) return projection.stripeCustomerId;

  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    name: tenant.name,
    email: tenant.billingEmail ?? undefined,
    metadata: {
      tenant_id: tenant.id,
      tenant_slug: tenant.slug ?? "",
    },
  });

  await writeProjection(tenantId, (tenant.currentPlanCode as PlanCode | undefined) ?? "builder", projection.summary.billingState as BillingState, projection, {
    stripeCustomerId: customer.id,
  });

  return customer.id;
}

export function envelope<T>(data: T, tenantId: string, planId: string): ApiEnvelope<T> {
  return {
    ok: true,
    data,
    error: null,
    meta: {
      requestId: requestId(),
      tenantId,
      planId,
      cursor: null,
    },
  };
}

export async function getMe() {
  const me = await meRecord();
  return envelope(me, me.tenantId, me.planId);
}

export async function listTenants() {
  return tenantRecords();
}

export async function listApiKeys(tenantId: string) {
  return isPostgresEnabled() ? listApiKeyRecords(tenantId) : memoryState().apiKeys[tenantId] ?? [];
}

export async function getUsageSummary(tenantId: string) {
  return usageRecord(tenantId);
}

export async function getBillingSummary(tenantId: string) {
  return (await billingProjection(tenantId)).summary;
}

export async function createCheckoutSession(input: { tenantId: string; planCode: PlanCode; successUrl: string; cancelUrl: string }) {
  if (!(await hasBillingRole())) throw new Error("Forbidden");
  if (input.planCode === "builder" || input.planCode === "enterprise") {
    throw new Error("Checkout is only supported for self-serve paid plans");
  }

  if (isStripeEnabled()) {
    const customerId = await ensureStripeCustomer(input.tenantId);
    const priceId = getStripePriceId(input.planCode);
    if (!customerId || !priceId) throw new Error(`Stripe price is not configured for ${input.planCode}`);

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: { tenant_id: input.tenantId, plan_code: input.planCode },
      subscription_data: { metadata: { tenant_id: input.tenantId, plan_code: input.planCode } },
      allow_promotion_codes: false,
    });

    return {
      checkout_url: session.url ?? input.cancelUrl,
      session_id: session.id,
      provider: "stripe" as const,
    };
  }

  const sessionId = `cs_mock_${Math.random().toString(36).slice(2, 10)}`;
  const sessionRecord: BillingSessionRecord = {
    id: sessionId,
    tenantId: input.tenantId,
    kind: "checkout",
    planCode: input.planCode,
    state: "created",
    returnUrl: input.successUrl,
    createdAt: nowIso(),
  };

  if (isPostgresEnabled()) {
    await saveBillingSessionRecord(sessionRecord);
  } else {
    memoryState().sessions[sessionId] = sessionRecord;
  }

  return {
    checkout_url: sameOriginAbsoluteUrl(`/api/control/mock/checkout?session_id=${sessionId}&plan_code=${input.planCode}`),
    session_id: sessionId,
    provider: "mock" as const,
  };
}

export async function createPortalSession(input: { tenantId: string; returnUrl: string }) {
  if (!(await hasBillingRole())) throw new Error("Forbidden");

  if (isStripeEnabled()) {
    const customerId = await ensureStripeCustomer(input.tenantId);
    if (!customerId) throw new Error("Stripe customer is not configured");
    const stripe = getStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: input.returnUrl,
    });
    return {
      portal_url: session.url,
      session_id: session.id,
      provider: "stripe" as const,
    };
  }

  const sessionId = `bps_mock_${Math.random().toString(36).slice(2, 10)}`;
  const sessionRecord: BillingSessionRecord = {
    id: sessionId,
    tenantId: input.tenantId,
    kind: "portal",
    state: "created",
    returnUrl: input.returnUrl,
    createdAt: nowIso(),
  };

  if (isPostgresEnabled()) {
    await saveBillingSessionRecord(sessionRecord);
  } else {
    memoryState().sessions[sessionId] = sessionRecord;
  }

  return {
    portal_url: sameOriginAbsoluteUrl(`/billing/portal?session_id=${sessionId}`),
    session_id: sessionId,
    provider: "mock" as const,
  };
}

export async function applyStripeWebhook(input: {
  id: string;
  type: string;
  tenantId: string;
  planCode?: PlanCode;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
  billingState?: string | null;
}) {
  if (isPostgresEnabled()) {
    if (await hasWebhookEventRecord(input.id)) return { duplicate: true };
    await saveWebhookEventRecord(input.id, input.type);
  } else {
    const state = memoryState();
    if (state.webhooks[input.id]) return { duplicate: true };
    state.webhooks[input.id] = { id: input.id, type: input.type, processedAt: nowIso() };
  }

  const [tenants, projection] = await Promise.all([tenantRecords(), billingProjection(input.tenantId)]);
  const tenant = tenants.find((item) => item.id === input.tenantId);
  if (!tenant) throw new Error("Unknown tenant");

  let planCode = (tenant.currentPlanCode as PlanCode | undefined) ?? "builder";
  let billingState = projection.summary.billingState as BillingState;

  switch (input.type) {
    case "checkout.session.completed":
    case "customer.subscription.created":
    case "customer.subscription.updated":
      planCode = input.planCode ?? planCodeFromPriceId(input.stripePriceId) ?? "startup";
      billingState = normalizeBillingState(input.billingState ?? "active");
      break;
    case "invoice.payment_failed":
      billingState = "past_due";
      break;
    case "customer.subscription.deleted":
      planCode = "builder";
      billingState = "canceled";
      break;
    case "invoice.paid":
      billingState = "active";
      break;
    default:
      break;
  }

  await writeProjection(input.tenantId, planCode, billingState, projection, {
    stripeCustomerId: input.stripeCustomerId,
    stripeSubscriptionId: input.stripeSubscriptionId,
    stripePriceId: input.stripePriceId,
  });

  return { duplicate: false };
}

function readSubscriptionData(subscription: Stripe.Subscription | null | undefined) {
  const priceId = stripeId(subscription?.items.data[0]?.price);
  return {
    stripeSubscriptionId: subscription?.id ?? null,
    stripePriceId: priceId,
    planCode: planCodeFromPriceId(priceId),
    billingState: subscription?.status ?? null,
  };
}

export function parseStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata ?? {};
      return {
        id: event.id,
        type: event.type,
        tenantId: metadata.tenant_id ?? "",
        planCode: (metadata.plan_code as PlanCode | undefined) ?? undefined,
        stripeCustomerId: stripeId(session.customer),
        stripeSubscriptionId: stripeId(session.subscription),
      };
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const metadata = subscription.metadata ?? {};
      const subscriptionData = readSubscriptionData(subscription);
      return {
        id: event.id,
        type: event.type,
        tenantId: metadata.tenant_id ?? "",
        planCode: (metadata.plan_code as PlanCode | undefined) ?? subscriptionData.planCode ?? undefined,
        stripeCustomerId: stripeId(subscription.customer),
        stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
        stripePriceId: subscriptionData.stripePriceId,
        billingState: subscriptionData.billingState,
      };
    }
    case "invoice.paid":
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscription = invoice.parent?.subscription_details?.subscription;
      const linePriceId = stripeId(invoice.lines.data[0]?.pricing?.price_details?.price);
      return {
        id: event.id,
        type: event.type,
        tenantId: invoice.lines.data[0]?.metadata?.tenant_id ?? invoice.parent?.subscription_details?.metadata?.tenant_id ?? "",
        planCode:
          (invoice.lines.data[0]?.metadata?.plan_code as PlanCode | undefined) ??
          (invoice.parent?.subscription_details?.metadata?.plan_code as PlanCode | undefined) ??
          planCodeFromPriceId(linePriceId) ??
          undefined,
        stripeCustomerId: stripeId(invoice.customer),
        stripeSubscriptionId: stripeId(subscription),
        stripePriceId: linePriceId,
      };
    }
    default:
      return null;
  }
}

export function verifyAndParseStripeWebhook(rawBody: string, signature: string | null) {
  const secret = getStripeWebhookSecret();
  if (!secret) throw new Error("Stripe webhook secret is not configured");
  if (!signature) throw new Error("Stripe signature header is missing");
  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}

export async function completeCheckoutSession(sessionId: string, action: "success" | "cancel") {
  const session = isPostgresEnabled() ? await getBillingSessionRecord(sessionId) : memoryState().sessions[sessionId];
  if (!session || session.kind !== "checkout") throw new Error("Unknown session");

  session.state = action === "success" ? "completed" : "canceled";
  if (isPostgresEnabled()) {
    await saveBillingSessionRecord(session);
  } else {
    memoryState().sessions[sessionId] = session;
  }

  if (action === "success" && session.planCode) {
    await applyStripeWebhook({
      id: `evt_${sessionId}`,
      type: "checkout.session.completed",
      tenantId: session.tenantId,
      planCode: session.planCode,
    });
    await applyStripeWebhook({
      id: `evt_sub_${sessionId}`,
      type: "customer.subscription.updated",
      tenantId: session.tenantId,
      planCode: session.planCode,
      billingState: "active",
    });
  }

  return session;
}
