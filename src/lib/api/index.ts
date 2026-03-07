/**
 * KEON Control API Client
 * Centralized API client for all backend services
 */

// Client & Configuration
export { apiClient, ApiClient } from './client';
export type { RequestOptions, ApiResponse } from './client';
export { getApiConfig, defaultApiConfig } from './config';
export type { ApiConfig } from './config';

// Errors
export {
  ApiError,
  NetworkError,
  TimeoutError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ServerError,
  parseApiError,
} from './errors';

// Types
export type {
  PagedResponse,
  ReceiptEnvelope,
  ReceiptPage,
  ExecutionLink,
  ExecutionTiming,
  ExecutionResult,
  ExecutionPage,
  ExecutionTraceEvent,
  CorrelationSummary,
  CorrelationPage,
  ReceiptNode,
  ReceiptSpine,
  Alert,
  Policy,
  Tenant,
  CheckoutSessionResponse,
  PortalSessionResponse,
  SystemMetrics,
  EvidencePackRequest,
  EvidencePackMetadata,
  LegalHoldCreateRequest,
  LegalHold,
  RetentionRun,
  ApiEnvelope,
  ApiMeta,
  ApiErrorPayload,
  MeResponse,
  TenantLimits,
  TenantProfile,
  DashboardSummary,
  DashboardHealthItem,
  DashboardTrustBreakdown,
  DashboardTrustVector,
  DashboardActivityItem,
  DashboardPolicyOverrides,
  DashboardQuorumHealth,
  DashboardLastIrreversible,
  DashboardScorecard,
} from './types';

// Receipts API
export { listReceipts, getReceipt } from './receipts';
export type { ListReceiptsOptions, GetReceiptOptions } from './receipts';

// Executions API
export { listExecutions, getExecution, getExecutionTrace } from './executions';
export type { ListExecutionsOptions, GetExecutionOptions } from './executions';

// Traces (Observability) API
export { getSpine, listCorrelations } from './traces';
export type { GetSpineOptions, ListCorrelationsOptions } from './traces';

// Alerts API (stub)
export { listAlerts, acknowledgeAlert, acknowledgeAllAlerts } from './alerts';
export type { ListAlertsOptions, AcknowledgeAlertOptions } from './alerts';

// Policies API (stub)
export { listPolicies, getPolicy } from './policies';
export type { ListPoliciesOptions, GetPolicyOptions } from './policies';

// Tenants API (stub)
export { listTenants, getTenant } from './tenants';
export type { ListTenantsOptions, GetTenantOptions } from './tenants';

// Tenant Control Plane
export {
  getMe,
  getTenantProfile,
  getDashboardScorecard,
  getDashboardSummary,
  getDashboardHealth,
  getDashboardTrustVector,
  getDashboardActivity,
  getDashboardLastIrreversible,
  createCheckoutSession,
  createPortalSession,
} from './control-plane';
