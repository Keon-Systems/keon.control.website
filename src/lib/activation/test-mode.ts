import type { MeResponse, Tenant, UsageSummary } from "@/lib/api/types";
import type { ActivationContextSummary } from "./types";

export const INTERNAL_TEST_TENANT_ID = "ten_keon_internal_test";
export const INTERNAL_TEST_WORKSPACE_NAME = "Keon Internal Test Workspace";
export const INTERNAL_TEST_USER_ID = "usr_keon_internal_test";

export const INTERNAL_TEST_ACTIVATION: ActivationContextSummary = {
  mode: "test",
  source: "test_token",
  tenantId: INTERNAL_TEST_TENANT_ID,
  tenantName: INTERNAL_TEST_WORKSPACE_NAME,
  workspaceId: INTERNAL_TEST_TENANT_ID,
  workspaceName: INTERNAL_TEST_WORKSPACE_NAME,
  environment: "sandbox",
  uiLabel: "Test activation mode",
};

export const INTERNAL_TEST_TENANT: Tenant = {
  id: INTERNAL_TEST_TENANT_ID,
  name: INTERNAL_TEST_WORKSPACE_NAME,
  status: "active",
  createdAt: "2026-04-01T00:00:00Z",
  slug: "keon-internal-test",
  currentPlanCode: "growth",
  billingEmail: "internal-testing@keon.systems",
  emailVerified: true,
};

export const INTERNAL_TEST_ME: MeResponse = {
  userId: INTERNAL_TEST_USER_ID,
  tenantId: INTERNAL_TEST_TENANT_ID,
  tenantName: INTERNAL_TEST_WORKSPACE_NAME,
  planId: "enterprise",
  roles: ["internal", "tester"],
  operatorModeEnabled: false,
};

export function buildInternalTestUsageSummary(): UsageSummary {
  return {
    tenantId: INTERNAL_TEST_TENANT_ID,
    billingPeriodStartUtc: "2026-04-01T00:00:00Z",
    authorizedExecutions: 24,
    deniedExecutions: 1,
    failedSystemExecutions: 0,
    totalQuotaConsumed: 25,
    daily: [
      { date: "2026-04-01", authorizedExecutions: 7, deniedExecutions: 0, totalExecutions: 7 },
      { date: "2026-04-02", authorizedExecutions: 9, deniedExecutions: 1, totalExecutions: 10 },
      { date: "2026-04-03", authorizedExecutions: 8, deniedExecutions: 0, totalExecutions: 8 },
    ],
  };
}
