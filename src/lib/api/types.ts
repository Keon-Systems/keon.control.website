/**
 * API Types
 * TypeScript types for KEON Control API contracts
 */

/**
 * Pagination
 */
export interface PagedResponse<T> {
  items: T[];
  nextPageToken?: string | null;
}

/**
 * Receipts
 */
export interface ReceiptEnvelope {
  receiptId: string;
  kind: 'decision' | 'execution' | 'memory';
  tenantId: string;
  correlationId: string;
  timestampUtc: string;
  payload: unknown;
}

export type ReceiptPage = PagedResponse<ReceiptEnvelope>;

/**
 * Executions
 */
export interface ExecutionLink {
  tenantId: string;
  correlationId: string;
}

export interface ExecutionTiming {
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
}

export interface ExecutionResult {
  executionId: string;
  link: ExecutionLink;
  timing: ExecutionTiming;
  status: 'started' | 'running' | 'completed' | 'failed' | 'aborted';
  error?: string;
  metadata?: Record<string, unknown>;
}

export type ExecutionPage = PagedResponse<ExecutionResult>;

/**
 * Traces
 */
export interface ExecutionTraceEvent {
  executionId: string;
  sequence: number;
  stage: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

/**
 * Correlation Summaries
 */
export interface CorrelationSummary {
  correlationId: string;
  tenantId: string;
  firstSeen: string;
  lastSeen: string;
  receiptCount: number;
  executionCount: number;
}

export type CorrelationPage = PagedResponse<CorrelationSummary>;

/**
 * Receipt Graph / Spine
 */
export interface ReceiptNode {
  nodeId: string;
  nodeType: 'decision' | 'execution' | 'memory' | 'trace' | 'unknown';
  payload: unknown;
}

export interface ReceiptSpine {
  correlationId: string;
  nodes: ReceiptNode[];
}

/**
 * Alerts
 */
export interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  source?: string;
  correlationId?: string;
}

/**
 * Policies (stub for now)
 */
export interface Policy {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Tenants (stub for now)
 */
export interface Tenant {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  slug?: string;
  currentPlanCode?: string;
  billingEmail?: string | null;
  emailVerified?: boolean;
}

export interface ApiKeyPreview {
  id: string;
  name: string;
  prefix: string;
  mode: 'live' | 'test';
  status: 'active' | 'revoked';
  environmentId: string;
  lastUsedAtUtc?: string | null;
  lastUsedIp?: string | null;
  createdAtUtc: string;
}

export interface DailyUsagePoint {
  date: string;
  authorizedExecutions: number;
  deniedExecutions: number;
  totalExecutions: number;
}

export interface UsageSummary {
  tenantId: string;
  billingPeriodStartUtc: string;
  authorizedExecutions: number;
  deniedExecutions: number;
  failedSystemExecutions: number;
  totalQuotaConsumed: number;
  daily: DailyUsagePoint[];
}

export interface BillingSummary {
  planCode: string;
  planName: string;
  billingState: string;
  gracePeriodEndsAtUtc?: string | null;
  monthlyPriceUsd: number;
  includedExecutions: number;
  authorizedExecutions: number;
  deniedExecutions: number;
  overageExecutions: number;
  estimatedOverageUsd: number;
  billingPeriodStartUtc: string;
  billingPeriodEndUtc: string;
}

export interface CheckoutSessionResponse {
  checkout_url: string;
  session_id: string;
  provider?: "mock" | "stripe";
}

export interface PortalSessionResponse {
  portal_url: string;
  session_id: string;
  provider?: "mock" | "stripe";
}

export interface RecentExecution {
  executionId: string;
  environmentId: string;
  decision: string;
  receiptId?: string | null;
  occurredAtUtc: string;
}

export interface TenantOverview {
  tenant: Tenant;
  billing: BillingSummary;
  projectsCount: number;
  environmentsCount: number;
  apiKeysCount: number;
  recentExecutions: RecentExecution[];
  usage: UsageSummary;
}

/**
 * System Metrics
 */
export interface SystemMetrics {
  systemStatus: 'healthy' | 'degraded' | 'critical' | 'offline';
  activeExecutions: number;
  pendingDecisions: number;
  complianceScore: number;
  recentReceipts24h: number;
  alerts: {
    critical: number;
    warning: number;
    info: number;
  };
}

/**
 * Evidence Packs
 */
export interface EvidencePackRequest {
  tenantId: string;
  correlationId: string;
  name?: string;
  description?: string;
}

export interface EvidencePackMetadata {
  packId: string;
  tenantId: string;
  correlationId: string;
  name: string;
  createdAtUtc: string;
  artifactCount: number;
}

/**
 * Legal Holds
 */
export interface LegalHoldCreateRequest {
  tenantId: string;
  correlationId: string;
  reason: string;
  expiresAtUtc?: string;
}

export interface LegalHold {
  id: string;
  tenantId: string;
  correlationId: string;
  reason: string;
  createdAtUtc: string;
  expiresAtUtc?: string;
  revokedAtUtc?: string;
  revokedReason?: string;
  isActive: boolean;
}

/**
 * Retention Runs
 */
export interface RetentionRun {
  runId: string;
  startedAt: string;
  completedAt?: string;
  status: 'running' | 'completed' | 'failed';
  itemsProcessed: number;
  itemsDeleted: number;
  errors?: string[];
}

/**
 * Control Plane Envelope
 */
export interface ApiMeta {
  requestId: string;
  tenantId: string;
  planId: string;
  cursor?: string | null;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiEnvelope<T> {
  ok: boolean;
  data: T;
  error?: ApiErrorPayload | null;
  meta: ApiMeta;
}

/**
 * Tenant Control Plane
 */
export interface MeResponse {
  userId: string;
  tenantId: string;
  tenantName: string;
  planId: 'free' | 'startup' | 'growth' | 'enterprise';
  roles: string[];
  operatorModeEnabled: boolean;
}

export interface TenantLimits {
  executionsPerMonth: number;
  apiKeys: number;
  projects: number;
  evidenceExport: boolean;
  policyEditing: boolean;
  webhooks: boolean;
  orgTenants: boolean;
  sso: boolean;
  dedicatedRuntime: boolean;
}

export interface TenantProfile {
  tenantId: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended';
  planId: 'free' | 'startup' | 'growth' | 'enterprise';
  retentionDays: number;
  limits: TenantLimits;
}

export interface DashboardSummary {
  activeExecutions: number;
  pendingDecisions: number;
  compliancePct24h: number;
  receipts24h: number;
  activeAgents: number;
  avgLatencyMs: number;
}

export interface DashboardHealthItem {
  id: string;
  name: string;
  status: 'operational' | 'degraded' | 'impaired' | 'healthy' | 'critical' | 'offline';
  lastChangeAt: string;
  message?: string | null;
}

export interface DashboardTrustBreakdown {
  percent: number;
  sparkline: number[];
}

export interface DashboardTrustVector {
  score: number;
  policy: DashboardTrustBreakdown;
  receipts: DashboardTrustBreakdown;
  quorum: DashboardTrustBreakdown;
  latency: DashboardTrustBreakdown;
  trend: 'stable' | 'rising' | 'falling' | string;
}

export interface DashboardActivityItem {
  eventId: string;
  eventType: string;
  subjectId: string;
  timestamp: string;
  title: string;
  detailHref?: string | null;
  message?: string | null;
  signer?: string | null;
}

export interface DashboardPolicyOverrides {
  locked: boolean;
  count: number;
  activeOverrides: string[];
  upgradePlan?: string | null;
}

export interface DashboardQuorumHealth {
  membersOnline: number;
  membersRequired: number;
  status: 'healthy' | 'at_risk' | 'down';
}

export interface DashboardLastIrreversible {
  actionType: string;
  signer: string;
  timestamp: string;
  receiptId: string;
  href: string;
}

export interface DashboardScorecard {
  summary: DashboardSummary;
  health: DashboardHealthItem[];
  trustVector: DashboardTrustVector;
  activity: DashboardActivityItem[];
  policyOverrides: DashboardPolicyOverrides;
  quorumHealth: DashboardQuorumHealth;
  lastIrreversible: DashboardLastIrreversible;
}
