const stripeState = {
  customerId: "cus_123",
  checkoutSessionId: "cs_stripe_123",
  checkoutUrl: "https://checkout.stripe.test/session",
  portalSessionId: "bps_stripe_123",
  portalUrl: "https://billing.stripe.test/session",
  constructedEvent: null as unknown,
};

const customersCreate = vi.fn(async () => ({ id: stripeState.customerId }));
const checkoutCreate = vi.fn(async () => ({
  id: stripeState.checkoutSessionId,
  url: stripeState.checkoutUrl,
}));
const portalCreate = vi.fn(async () => ({
  id: stripeState.portalSessionId,
  url: stripeState.portalUrl,
}));
const constructEvent = vi.fn((rawBody: string, signature: string, secret: string) => {
  return stripeState.constructedEvent ?? { rawBody, signature, secret };
});

vi.mock("stripe", () => ({
  default: class StripeMock {
    customers = { create: customersCreate };
    checkout = { sessions: { create: checkoutCreate } };
    billingPortal = { sessions: { create: portalCreate } };
    webhooks = { constructEvent };
  },
}));

vi.mock("@/lib/server/control-plane-db", () => ({
  getBillingProjectionRecord: vi.fn(),
  getBillingSessionRecord: vi.fn(),
  getMeRecord: vi.fn(),
  getUsageSummaryRecord: vi.fn(),
  hasWebhookEventRecord: vi.fn(),
  isPostgresEnabled: vi.fn(() => false),
  listApiKeyRecords: vi.fn(),
  listTenantRecords: vi.fn(),
  saveBillingSessionRecord: vi.fn(),
  saveWebhookEventRecord: vi.fn(),
  updateMePlanRecord: vi.fn(),
  updateTenantPlanRecord: vi.fn(),
  upsertBillingProjectionRecord: vi.fn(),
}));

describe("control-plane service", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_APP_ORIGIN: "http://localhost:3000",
    };
    delete process.env.DATABASE_URL;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_PRICE_STARTUP;
    delete process.env.STRIPE_PRICE_GROWTH;
    delete (globalThis as typeof globalThis & { __keonControlPlaneMemoryState?: unknown }).__keonControlPlaneMemoryState;
    customersCreate.mockClear();
    checkoutCreate.mockClear();
    portalCreate.mockClear();
    constructEvent.mockClear();
    stripeState.constructedEvent = null;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns the default me envelope in memory mode", async () => {
    const mod = await import("@/lib/server/control-plane");

    const me = await mod.getMe();

    expect(me.ok).toBe(true);
    expect(me.data.tenantId).toBe("ten_keon_builder");
    expect(me.meta.planId).toBe("free");
  });

  it("creates a mock checkout session and applies plan changes on success", async () => {
    const mod = await import("@/lib/server/control-plane");

    const session = await mod.createCheckoutSession({
      tenantId: "ten_keon_builder",
      planCode: "startup",
      successUrl: "http://localhost:3000/billing/success",
      cancelUrl: "http://localhost:3000/billing/cancel",
    });

    expect(session.provider).toBe("mock");
    expect(session.checkout_url).toContain("/api/control/mock/checkout");

    await mod.completeCheckoutSession(session.session_id, "success");
    const billing = await mod.getBillingSummary("ten_keon_builder");

    expect(billing.planCode).toBe("startup");
    expect(billing.billingState).toBe("active");
    expect((await mod.getMe()).data.planId).toBe("startup");
  });

  it("creates a mock portal session in memory mode", async () => {
    const mod = await import("@/lib/server/control-plane");

    const session = await mod.createPortalSession({
      tenantId: "ten_keon_builder",
      returnUrl: "http://localhost:3000/admin/subscription",
    });

    expect(session.provider).toBe("mock");
    expect(session.portal_url).toContain("/billing/portal");
  });

  it("rejects unsupported self-serve plans for checkout", async () => {
    const mod = await import("@/lib/server/control-plane");

    await expect(
      mod.createCheckoutSession({
        tenantId: "ten_keon_builder",
        planCode: "enterprise",
        successUrl: "http://localhost:3000/billing/success",
        cancelUrl: "http://localhost:3000/billing/cancel",
      }),
    ).rejects.toThrow("Checkout is only supported for self-serve paid plans");
  });

  it("handles Stripe-backed checkout and portal session creation", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.STRIPE_PRICE_STARTUP = "price_startup";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_123";

    const mod = await import("@/lib/server/control-plane");

    const checkout = await mod.createCheckoutSession({
      tenantId: "ten_keon_builder",
      planCode: "startup",
      successUrl: "http://localhost:3000/billing/success",
      cancelUrl: "http://localhost:3000/billing/cancel",
    });
    const portal = await mod.createPortalSession({
      tenantId: "ten_keon_builder",
      returnUrl: "http://localhost:3000/admin/subscription",
    });

    expect(customersCreate).toHaveBeenCalledTimes(1);
    expect(checkoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_123",
        line_items: [{ price: "price_startup", quantity: 1 }],
      }),
    );
    expect(portalCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_123",
        return_url: "http://localhost:3000/admin/subscription",
      }),
    );
    expect(checkout.provider).toBe("stripe");
    expect(portal.provider).toBe("stripe");
  });

  it("applies webhook state transitions and deduplicates repeated webhook ids", async () => {
    const mod = await import("@/lib/server/control-plane");

    const first = await mod.applyStripeWebhook({
      id: "evt_1",
      type: "customer.subscription.updated",
      tenantId: "ten_keon_builder",
      planCode: "growth",
      billingState: "past_due",
    });
    const duplicate = await mod.applyStripeWebhook({
      id: "evt_1",
      type: "customer.subscription.updated",
      tenantId: "ten_keon_builder",
      planCode: "growth",
      billingState: "active",
    });
    const billing = await mod.getBillingSummary("ten_keon_builder");

    expect(first).toEqual({ duplicate: false });
    expect(duplicate).toEqual({ duplicate: true });
    expect(billing.planCode).toBe("growth");
    expect(billing.billingState).toBe("past_due");
  });

  it("parses supported Stripe events into internal webhook payloads", async () => {
    process.env.STRIPE_PRICE_GROWTH = "price_growth";

    const mod = await import("@/lib/server/control-plane");
    const parsed = mod.parseStripeEvent({
      id: "evt_123",
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_123",
          customer: "cus_123",
          status: "active",
          metadata: { tenant_id: "ten_keon_builder", plan_code: "growth" },
          items: { data: [{ price: { id: "price_growth" } }] },
        },
      },
    } as never);

    expect(parsed).toEqual({
      id: "evt_123",
      type: "customer.subscription.updated",
      tenantId: "ten_keon_builder",
      planCode: "growth",
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_123",
      stripePriceId: "price_growth",
      billingState: "active",
    });
  });

  it("verifies webhook signatures through the Stripe client", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_123";
    stripeState.constructedEvent = { id: "evt_verified" };

    const mod = await import("@/lib/server/control-plane");
    const event = mod.verifyAndParseStripeWebhook("{\"ok\":true}", "sig_123");

    expect(constructEvent).toHaveBeenCalledWith("{\"ok\":true}", "sig_123", "whsec_123");
    expect(event).toEqual({ id: "evt_verified" });
  });

  it("rejects webhook verification when secret or signature is missing", async () => {
    const mod = await import("@/lib/server/control-plane");
    expect(() => mod.verifyAndParseStripeWebhook("{}", null)).toThrow("Stripe webhook secret is not configured");

    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_123";
    const reloaded = await import("@/lib/server/control-plane");
    expect(() => reloaded.verifyAndParseStripeWebhook("{}", null)).toThrow("Stripe signature header is missing");
  });
});
