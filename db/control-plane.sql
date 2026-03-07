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
