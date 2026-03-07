import { apiClient } from "./client";
import type {
  ApiEnvelope,
  ApiKeyPreview,
  BillingSummary,
  CheckoutSessionResponse,
  DashboardActivityItem,
  DashboardHealthItem,
  DashboardLastIrreversible,
  DashboardScorecard,
  DashboardSummary,
  DashboardTrustVector,
  MeResponse,
  PortalSessionResponse,
  Tenant,
  TenantOverview,
  TenantProfile,
  UsageSummary,
} from "./types";

async function unwrapEnvelope<T>(request: Promise<ApiEnvelope<T>>): Promise<T> {
  const response = await request;

  if (!response.ok) {
    throw new Error(response.error?.message ?? "Control plane request failed");
  }

  return response.data;
}

export function getMe(): Promise<MeResponse> {
  return unwrapEnvelope(apiClient.get<ApiEnvelope<MeResponse>>("/v1/me"));
}

export function getTenantProfile(): Promise<TenantProfile> {
  return unwrapEnvelope(apiClient.get<ApiEnvelope<TenantProfile>>("/v1/tenant"));
}

export function getDashboardScorecard(window = "60m"): Promise<DashboardScorecard> {
  return unwrapEnvelope(
    apiClient.get<ApiEnvelope<DashboardScorecard>>("/v1/dashboard/scorecard", {
      params: { window },
    })
  );
}

export function getDashboardSummary(window = "60m"): Promise<DashboardSummary> {
  return unwrapEnvelope(
    apiClient.get<ApiEnvelope<DashboardSummary>>("/v1/dashboard/summary", {
      params: { window },
    })
  );
}

export function getDashboardHealth(): Promise<DashboardHealthItem[]> {
  return unwrapEnvelope(apiClient.get<ApiEnvelope<DashboardHealthItem[]>>("/v1/dashboard/health"));
}

export function getDashboardTrustVector(window = "60m"): Promise<DashboardTrustVector> {
  return unwrapEnvelope(
    apiClient.get<ApiEnvelope<DashboardTrustVector>>("/v1/dashboard/trust-vector", {
      params: { window },
    })
  );
}

export function getDashboardActivity(limit = 50): Promise<DashboardActivityItem[]> {
  return unwrapEnvelope(
    apiClient.get<ApiEnvelope<DashboardActivityItem[]>>("/v1/dashboard/activity", {
      params: { limit },
    })
  );
}

export function getDashboardLastIrreversible(): Promise<DashboardLastIrreversible> {
  return unwrapEnvelope(
    apiClient.get<ApiEnvelope<DashboardLastIrreversible>>("/v1/dashboard/last-irreversible")
  );
}

export function listControlTenants(): Promise<Tenant[]> {
  return apiClient.get<Tenant[]>("/v1/me/tenants");
}

export function getTenantOverview(tenantId: string): Promise<TenantOverview> {
  return apiClient.get<TenantOverview>(`/v1/tenants/${tenantId}/overview`);
}

export function listApiKeys(tenantId: string): Promise<ApiKeyPreview[]> {
  return apiClient.get<ApiKeyPreview[]>("/v1/api-keys", { params: { tenantId } });
}

export function getUsageSummary(tenantId: string): Promise<UsageSummary> {
  return apiClient.get<UsageSummary>("/v1/usage/summary", { params: { tenantId } });
}

export function getBillingSummary(tenantId: string): Promise<BillingSummary> {
  return apiClient.get<BillingSummary>("/v1/billing/summary", { params: { tenantId } });
}

export function createCheckoutSession(input: {
  tenantId: string;
  planCode: "builder" | "startup" | "growth" | "enterprise";
  successUrl: string;
  cancelUrl: string;
}): Promise<CheckoutSessionResponse> {
  return apiClient.post<CheckoutSessionResponse>("/v1/billing/checkout-session", {
    tenant_id: input.tenantId,
    plan_code: input.planCode,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
  });
}

export function createPortalSession(input: {
  tenantId: string;
  returnUrl: string;
}): Promise<PortalSessionResponse> {
  return apiClient.post<PortalSessionResponse>("/v1/billing/portal-session", {
    tenant_id: input.tenantId,
    return_url: input.returnUrl,
  });
}
