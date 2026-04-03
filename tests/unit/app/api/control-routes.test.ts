import { NextRequest } from "next/server";

const createCheckoutSession = vi.fn();
const createPortalSession = vi.fn();
const getBillingSummary = vi.fn();
const getUsageSummary = vi.fn();
const getMe = vi.fn();
const listTenants = vi.fn();
const listApiKeys = vi.fn();
const applyStripeWebhook = vi.fn();
const parseStripeEvent = vi.fn();
const verifyAndParseStripeWebhook = vi.fn();
const isStripeEnabled = vi.fn();
const getStripeWebhookSecret = vi.fn();

vi.mock("@/lib/server/control-plane", () => ({
  createCheckoutSession,
  createPortalSession,
  getBillingSummary,
  getUsageSummary,
  getMe,
  listTenants,
  listApiKeys,
  applyStripeWebhook,
  parseStripeEvent,
  verifyAndParseStripeWebhook,
}));

vi.mock("@/lib/server/stripe", () => ({
  isStripeEnabled,
  getStripeWebhookSecret,
}));

describe("control API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isStripeEnabled.mockReturnValue(false);
    getStripeWebhookSecret.mockReturnValue(null);
  });

  it("validates checkout session request bodies", async () => {
    const route = await import("@/app/api/control/v1/billing/checkout-session/route");
    const response = await route.POST(new NextRequest("http://localhost/api/control/v1/billing/checkout-session", {
      method: "POST",
      body: JSON.stringify({ tenant_id: "ten_1" }),
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "tenant_id, plan_code, success_url, and cancel_url are required",
    });
  });

  it("returns checkout session results and handles service errors", async () => {
    createCheckoutSession.mockResolvedValueOnce({ checkout_url: "https://checkout", session_id: "cs_1", provider: "mock" });
    const route = await import("@/app/api/control/v1/billing/checkout-session/route");

    const okResponse = await route.POST(new NextRequest("http://localhost/api/control/v1/billing/checkout-session", {
      method: "POST",
      body: JSON.stringify({
        tenant_id: "ten_1",
        plan_code: "startup",
        success_url: "http://localhost/billing/success",
        cancel_url: "http://localhost/billing/cancel",
      }),
    }));
    expect(okResponse.status).toBe(200);
    await expect(okResponse.json()).resolves.toEqual({ checkout_url: "https://checkout", session_id: "cs_1", provider: "mock" });

    createCheckoutSession.mockRejectedValueOnce(new Error("Forbidden"));
    const errorResponse = await route.POST(new NextRequest("http://localhost/api/control/v1/billing/checkout-session", {
      method: "POST",
      body: JSON.stringify({
        tenant_id: "ten_1",
        plan_code: "startup",
        success_url: "http://localhost/billing/success",
        cancel_url: "http://localhost/billing/cancel",
      }),
    }));
    expect(errorResponse.status).toBe(403);
    await expect(errorResponse.json()).resolves.toEqual({ error: "Forbidden" });
  });

  it("validates and returns portal session results", async () => {
    const route = await import("@/app/api/control/v1/billing/portal-session/route");
    const badResponse = await route.POST(new NextRequest("http://localhost/api/control/v1/billing/portal-session", {
      method: "POST",
      body: JSON.stringify({ tenant_id: "ten_1" }),
    }));
    expect(badResponse.status).toBe(400);

    createPortalSession.mockResolvedValueOnce({ portal_url: "https://portal", session_id: "bps_1", provider: "mock" });
    const okResponse = await route.POST(new NextRequest("http://localhost/api/control/v1/billing/portal-session", {
      method: "POST",
      body: JSON.stringify({ tenant_id: "ten_1", return_url: "http://localhost/admin/subscription" }),
    }));
    expect(okResponse.status).toBe(200);
    await expect(okResponse.json()).resolves.toEqual({ portal_url: "https://portal", session_id: "bps_1", provider: "mock" });
  });

  it("validates tenantId for summary and api-key routes", async () => {
    const billingRoute = await import("@/app/api/control/v1/billing/summary/route");
    const usageRoute = await import("@/app/api/control/v1/usage/summary/route");
    const apiKeysRoute = await import("@/app/api/control/v1/api-keys/route");

    expect((await billingRoute.GET(new NextRequest("http://localhost/api/control/v1/billing/summary"))).status).toBe(400);
    expect((await usageRoute.GET(new NextRequest("http://localhost/api/control/v1/usage/summary"))).status).toBe(400);
    expect((await apiKeysRoute.GET(new NextRequest("http://localhost/api/control/v1/api-keys"))).status).toBe(400);
  });

  it("returns billing, usage, me, tenants, and api keys", async () => {
    getBillingSummary.mockResolvedValueOnce({ planCode: "startup" });
    getUsageSummary.mockResolvedValueOnce({ tenantId: "ten_1", authorizedExecutions: 10 });
    getMe.mockResolvedValueOnce({ ok: true, data: { tenantId: "ten_1" } });
    listTenants.mockResolvedValueOnce([{ id: "ten_1" }]);
    listApiKeys.mockResolvedValueOnce([{ id: "key_1" }]);

    const billingRoute = await import("@/app/api/control/v1/billing/summary/route");
    const usageRoute = await import("@/app/api/control/v1/usage/summary/route");
    const meRoute = await import("@/app/api/control/v1/me/route");
    const tenantsRoute = await import("@/app/api/control/v1/me/tenants/route");
    const apiKeysRoute = await import("@/app/api/control/v1/api-keys/route");

    await expect((await billingRoute.GET(new NextRequest("http://localhost/api/control/v1/billing/summary?tenantId=ten_1"))).json()).resolves.toEqual({ planCode: "startup" });
    await expect((await usageRoute.GET(new NextRequest("http://localhost/api/control/v1/usage/summary?tenantId=ten_1"))).json()).resolves.toEqual({ tenantId: "ten_1", authorizedExecutions: 10 });
    await expect((await meRoute.GET()).json()).resolves.toEqual({ ok: true, data: { tenantId: "ten_1" } });
    await expect((await tenantsRoute.GET()).json()).resolves.toEqual([{ id: "ten_1" }]);
    await expect((await apiKeysRoute.GET(new NextRequest("http://localhost/api/control/v1/api-keys?tenantId=ten_1"))).json()).resolves.toEqual([{ id: "key_1" }]);
  });

  it("handles Stripe and mock webhook flows", async () => {
    const route = await import("@/app/api/control/v1/webhooks/stripe/route");

    isStripeEnabled.mockReturnValue(true);
    getStripeWebhookSecret.mockReturnValue("whsec_123");
    verifyAndParseStripeWebhook.mockReturnValue({ id: "evt_1" });
    parseStripeEvent.mockReturnValue({ id: "evt_1", type: "checkout.session.completed", tenantId: "ten_1" });
    applyStripeWebhook.mockResolvedValueOnce({ duplicate: false });

    const stripeResponse = await route.POST(new NextRequest("http://localhost/api/control/v1/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": "sig_123" },
      body: JSON.stringify({}),
    }));
    expect(stripeResponse.status).toBe(202);
    await expect(stripeResponse.json()).resolves.toEqual({ accepted: true, duplicate: false, provider: "stripe" });

    isStripeEnabled.mockReturnValue(false);
    getStripeWebhookSecret.mockReturnValue(null);
    applyStripeWebhook.mockResolvedValueOnce({ duplicate: true });

    const mockResponse = await route.POST(new NextRequest("http://localhost/api/control/v1/webhooks/stripe", {
      method: "POST",
      body: JSON.stringify({ id: "evt_2", type: "invoice.paid", tenant_id: "ten_1", plan_code: "startup" }),
    }));
    expect(mockResponse.status).toBe(202);
    await expect(mockResponse.json()).resolves.toEqual({ accepted: true, duplicate: true, provider: "mock" });
  });

  it("rejects malformed webhook payloads", async () => {
    const route = await import("@/app/api/control/v1/webhooks/stripe/route");

    const response = await route.POST(new NextRequest("http://localhost/api/control/v1/webhooks/stripe", {
      method: "POST",
      body: JSON.stringify({ id: "evt_2" }),
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "id, type, and tenant_id are required" });
  });
});
