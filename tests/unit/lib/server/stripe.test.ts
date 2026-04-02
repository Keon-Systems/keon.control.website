const stripeCtor = vi.fn();

vi.mock("stripe", () => ({
  default: class StripeMock {
    constructor(secretKey: string) {
      stripeCtor(secretKey);
    }
  },
}));

describe("stripe helpers", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_PRICE_STARTUP;
    delete process.env.STRIPE_PRICE_GROWTH;
    stripeCtor.mockReset();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("reports whether Stripe is enabled", async () => {
    const mod = await import("@/lib/server/stripe");
    expect(mod.isStripeEnabled()).toBe(false);

    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    const reloaded = await import("@/lib/server/stripe");
    expect(reloaded.isStripeEnabled()).toBe(true);
  });

  it("creates a Stripe client with the configured secret", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    const mod = await import("@/lib/server/stripe");

    mod.getStripeClient();

    expect(stripeCtor).toHaveBeenCalledWith("sk_test_123");
  });

  it("throws when Stripe client creation is attempted without configuration", async () => {
    const mod = await import("@/lib/server/stripe");
    expect(() => mod.getStripeClient()).toThrow("Stripe is not configured");
  });

  it("reads webhook secret and price catalog from the environment", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_123";
    process.env.STRIPE_PRICE_STARTUP = "price_startup";
    process.env.STRIPE_PRICE_GROWTH = "price_growth";

    const mod = await import("@/lib/server/stripe");

    expect(mod.getStripeWebhookSecret()).toBe("whsec_123");
    expect(mod.getStripePriceCatalog()).toEqual({
      startup: "price_startup",
      growth: "price_growth",
    });
  });

  it("maps price ids to plan codes and back", async () => {
    process.env.STRIPE_PRICE_STARTUP = "price_startup";
    process.env.STRIPE_PRICE_GROWTH = "price_growth";

    const mod = await import("@/lib/server/stripe");

    expect(mod.getStripePriceId("startup")).toBe("price_startup");
    expect(mod.getStripePriceId("growth")).toBe("price_growth");
    expect(mod.getStripePriceId("enterprise")).toBeNull();
    expect(mod.planCodeFromPriceId("price_startup")).toBe("startup");
    expect(mod.planCodeFromPriceId("price_growth")).toBe("growth");
    expect(mod.planCodeFromPriceId("unknown")).toBeNull();
  });
});
