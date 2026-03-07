import { Pool } from "pg";
import type { ApiKeyPreview, BillingSummary, MeResponse, Tenant, UsageSummary } from "@/lib/api/types";

type PlanCode = "builder" | "startup" | "growth" | "enterprise";

export interface BillingSessionRecord {
  id: string;
  tenantId: string;
  kind: "checkout" | "portal";
  planCode?: PlanCode;
  state: "created" | "completed" | "canceled";
  returnUrl: string;
  createdAt: string;
}

export interface BillingProjectionRecord {
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
  summary: BillingSummary;
}

let pool: Pool | null = null;
let initPromise: Promise<void> | null = null;

function defaultSeed() {
  const tenantId = "ten_keon_builder";
  const usage: UsageSummary = {
    tenantId,
    billingPeriodStartUtc: "2026-03-01T00:00:00Z",
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

  const billing: BillingSummary = {
    planCode: "builder",
    planName: "Builder",
    billingState: "trialing",
    gracePeriodEndsAtUtc: null,
    monthlyPriceUsd: 0,
    includedExecutions: 1_000,
    authorizedExecutions: usage.authorizedExecutions,
    deniedExecutions: usage.deniedExecutions,
    overageExecutions: 0,
    estimatedOverageUsd: 0,
    billingPeriodStartUtc: "2026-03-01T00:00:00Z",
    billingPeriodEndUtc: "2026-04-01T00:00:00Z",
  };

  const me: MeResponse = {
    userId: "usr_clint",
    tenantId,
    tenantName: "Keon Systems",
    planId: "free",
    roles: ["owner", "admin", "billing"],
    operatorModeEnabled: false,
  };

  const tenant: Tenant = {
    id: tenantId,
    name: "Keon Systems",
    status: "active",
    createdAt: "2026-03-01T00:00:00Z",
    slug: "keon-systems",
    currentPlanCode: "builder",
    billingEmail: "billing@keon.systems",
    emailVerified: true,
  };

  const apiKey: ApiKeyPreview = {
    id: "key_test_001",
    name: "Default Test Key",
    prefix: "test_a1b2",
    mode: "test",
    status: "active",
    environmentId: "env_dev",
    lastUsedAtUtc: "2026-03-05T18:20:00Z",
    lastUsedIp: "127.0.0.1",
    createdAtUtc: "2026-03-01T00:05:00Z",
  };

  return { me, tenant, usage, billing, apiKey };
}

export function isPostgresEnabled() {
  return Boolean(process.env.DATABASE_URL);
}

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not configured");
    }

    pool = new Pool({
      connectionString,
      max: Number.parseInt(process.env.DATABASE_POOL_MAX || "5", 10),
    });
  }

  return pool;
}

async function initialize() {
  const db = getPool();
  await db.query(`
    create table if not exists control_me (
      user_id text primary key,
      tenant_id text not null,
      tenant_name text not null,
      plan_id text not null,
      roles_json jsonb not null,
      operator_mode_enabled boolean not null default false
    );

    create table if not exists control_tenants (
      id text primary key,
      name text not null,
      status text not null,
      created_at timestamptz not null,
      slug text,
      current_plan_code text,
      billing_email text,
      email_verified boolean not null default false
    );

    create table if not exists control_api_keys (
      id text primary key,
      tenant_id text not null references control_tenants(id) on delete cascade,
      payload jsonb not null
    );

    create table if not exists control_usage_summaries (
      tenant_id text primary key references control_tenants(id) on delete cascade,
      payload jsonb not null,
      updated_at timestamptz not null default now()
    );

    create table if not exists control_billing_projections (
      tenant_id text primary key references control_tenants(id) on delete cascade,
      stripe_customer_id text,
      stripe_subscription_id text,
      stripe_price_id text,
      summary jsonb not null,
      updated_at timestamptz not null default now()
    );

    create table if not exists control_billing_sessions (
      id text primary key,
      tenant_id text not null references control_tenants(id) on delete cascade,
      kind text not null,
      plan_code text,
      state text not null,
      return_url text not null,
      created_at timestamptz not null
    );

    create table if not exists control_webhook_events (
      id text primary key,
      event_type text not null,
      processed_at timestamptz not null
    );
  `);

  const existing = await db.query<{ count: string }>("select count(*)::text as count from control_me");
  if (existing.rows[0]?.count !== "0") {
    return;
  }

  const seed = defaultSeed();
  await db.query("begin");
  try {
    await db.query(
      `insert into control_me (user_id, tenant_id, tenant_name, plan_id, roles_json, operator_mode_enabled)
       values ($1, $2, $3, $4, $5::jsonb, $6)`,
      [seed.me.userId, seed.me.tenantId, seed.me.tenantName, seed.me.planId, JSON.stringify(seed.me.roles), seed.me.operatorModeEnabled],
    );
    await db.query(
      `insert into control_tenants (id, name, status, created_at, slug, current_plan_code, billing_email, email_verified)
       values ($1, $2, $3, $4::timestamptz, $5, $6, $7, $8)`,
      [seed.tenant.id, seed.tenant.name, seed.tenant.status, seed.tenant.createdAt, seed.tenant.slug, seed.tenant.currentPlanCode, seed.tenant.billingEmail, seed.tenant.emailVerified],
    );
    await db.query(
      `insert into control_api_keys (id, tenant_id, payload) values ($1, $2, $3::jsonb)`,
      [seed.apiKey.id, seed.tenant.id, JSON.stringify(seed.apiKey)],
    );
    await db.query(
      `insert into control_usage_summaries (tenant_id, payload) values ($1, $2::jsonb)`,
      [seed.tenant.id, JSON.stringify(seed.usage)],
    );
    await db.query(
      `insert into control_billing_projections (tenant_id, stripe_customer_id, stripe_subscription_id, stripe_price_id, summary)
       values ($1, null, null, null, $2::jsonb)`,
      [seed.tenant.id, JSON.stringify(seed.billing)],
    );
    await db.query("commit");
  } catch (error) {
    await db.query("rollback");
    throw error;
  }
}

async function ensureInitialized() {
  if (!initPromise) {
    initPromise = initialize();
  }
  await initPromise;
}

export async function getMeRecord(): Promise<MeResponse> {
  await ensureInitialized();
  const { rows } = await getPool().query<{
    user_id: string;
    tenant_id: string;
    tenant_name: string;
    plan_id: "free" | "startup" | "growth" | "enterprise";
    roles_json: string[];
    operator_mode_enabled: boolean;
  }>("select user_id, tenant_id, tenant_name, plan_id, roles_json, operator_mode_enabled from control_me limit 1");
  const row = rows[0];
  if (!row) throw new Error("Missing control_me row");
  return {
    userId: row.user_id,
    tenantId: row.tenant_id,
    tenantName: row.tenant_name,
    planId: row.plan_id,
    roles: row.roles_json,
    operatorModeEnabled: row.operator_mode_enabled,
  };
}

export async function listTenantRecords(): Promise<Tenant[]> {
  await ensureInitialized();
  const { rows } = await getPool().query<{
    id: string; name: string; status: Tenant["status"]; created_at: Date; slug: string | null;
    current_plan_code: string | null; billing_email: string | null; email_verified: boolean;
  }>("select id, name, status, created_at, slug, current_plan_code, billing_email, email_verified from control_tenants order by created_at asc");
  return rows.map((row: {
    id: string; name: string; status: Tenant["status"]; created_at: Date; slug: string | null;
    current_plan_code: string | null; billing_email: string | null; email_verified: boolean;
  }) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    slug: row.slug ?? undefined,
    currentPlanCode: row.current_plan_code ?? undefined,
    billingEmail: row.billing_email,
    emailVerified: row.email_verified,
  }));
}

export async function listApiKeyRecords(tenantId: string): Promise<ApiKeyPreview[]> {
  await ensureInitialized();
  const { rows } = await getPool().query<{ payload: ApiKeyPreview }>(
    "select payload from control_api_keys where tenant_id = $1 order by id asc",
    [tenantId],
  );
  return rows.map((row: { payload: ApiKeyPreview }) => row.payload);
}

export async function getUsageSummaryRecord(tenantId: string): Promise<UsageSummary> {
  await ensureInitialized();
  const { rows } = await getPool().query<{ payload: UsageSummary }>(
    "select payload from control_usage_summaries where tenant_id = $1",
    [tenantId],
  );
  if (!rows[0]) throw new Error("Unknown tenant");
  return rows[0].payload;
}

export async function getBillingProjectionRecord(tenantId: string): Promise<BillingProjectionRecord> {
  await ensureInitialized();
  const { rows } = await getPool().query<{
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    stripe_price_id: string | null;
    summary: BillingSummary;
  }>(
    "select stripe_customer_id, stripe_subscription_id, stripe_price_id, summary from control_billing_projections where tenant_id = $1",
    [tenantId],
  );
  if (!rows[0]) throw new Error("Unknown tenant");
  return {
    stripeCustomerId: rows[0].stripe_customer_id,
    stripeSubscriptionId: rows[0].stripe_subscription_id,
    stripePriceId: rows[0].stripe_price_id,
    summary: rows[0].summary,
  };
}

export async function upsertBillingProjectionRecord(tenantId: string, projection: BillingProjectionRecord) {
  await ensureInitialized();
  await getPool().query(
    `insert into control_billing_projections (tenant_id, stripe_customer_id, stripe_subscription_id, stripe_price_id, summary, updated_at)
     values ($1, $2, $3, $4, $5::jsonb, now())
     on conflict (tenant_id) do update set
       stripe_customer_id = excluded.stripe_customer_id,
       stripe_subscription_id = excluded.stripe_subscription_id,
       stripe_price_id = excluded.stripe_price_id,
       summary = excluded.summary,
       updated_at = now()`,
    [
      tenantId,
      projection.stripeCustomerId ?? null,
      projection.stripeSubscriptionId ?? null,
      projection.stripePriceId ?? null,
      JSON.stringify(projection.summary),
    ],
  );
}

export async function updateTenantPlanRecord(tenantId: string, planCode: PlanCode) {
  await ensureInitialized();
  await getPool().query("update control_tenants set current_plan_code = $2 where id = $1", [tenantId, planCode]);
}

export async function updateMePlanRecord(planId: MeResponse["planId"]) {
  await ensureInitialized();
  await getPool().query("update control_me set plan_id = $1", [planId]);
}

export async function saveBillingSessionRecord(session: BillingSessionRecord) {
  await ensureInitialized();
  await getPool().query(
    `insert into control_billing_sessions (id, tenant_id, kind, plan_code, state, return_url, created_at)
     values ($1, $2, $3, $4, $5, $6, $7::timestamptz)
     on conflict (id) do update set
       state = excluded.state,
       return_url = excluded.return_url,
       plan_code = excluded.plan_code`,
    [session.id, session.tenantId, session.kind, session.planCode ?? null, session.state, session.returnUrl, session.createdAt],
  );
}

export async function getBillingSessionRecord(sessionId: string): Promise<BillingSessionRecord | null> {
  await ensureInitialized();
  const { rows } = await getPool().query<{
    id: string; tenant_id: string; kind: "checkout" | "portal"; plan_code: PlanCode | null;
    state: "created" | "completed" | "canceled"; return_url: string; created_at: Date;
  }>("select id, tenant_id, kind, plan_code, state, return_url, created_at from control_billing_sessions where id = $1", [sessionId]);
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    tenantId: row.tenant_id,
    kind: row.kind,
    planCode: row.plan_code ?? undefined,
    state: row.state,
    returnUrl: row.return_url,
    createdAt: row.created_at.toISOString(),
  };
}

export async function hasWebhookEventRecord(id: string): Promise<boolean> {
  await ensureInitialized();
  const { rowCount } = await getPool().query("select 1 from control_webhook_events where id = $1", [id]);
  return (rowCount ?? 0) > 0;
}

export async function saveWebhookEventRecord(id: string, type: string) {
  await ensureInitialized();
  await getPool().query(
    `insert into control_webhook_events (id, event_type, processed_at)
     values ($1, $2, now())
     on conflict (id) do nothing`,
    [id, type],
  );
}

export async function runSchemaSql(sql: string) {
  await getPool().query(sql);
}
