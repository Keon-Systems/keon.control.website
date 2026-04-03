const get = vi.fn();
const post = vi.fn();

vi.mock("@/lib/api/client", () => ({
  apiClient: {
    get,
    post,
  },
}));

describe("control-plane api wrappers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("unwraps envelope-based reads", async () => {
    get
      .mockResolvedValueOnce({ ok: true, data: { tenantId: "ten_1" } })
      .mockResolvedValueOnce({ ok: true, data: { score: 99 } })
      .mockResolvedValueOnce({ ok: true, data: { summary: true } })
      .mockResolvedValueOnce({ ok: true, data: [{ subsystem: "runtime" }] })
      .mockResolvedValueOnce({ ok: true, data: { trust: 98 } })
      .mockResolvedValueOnce({ ok: true, data: [{ id: "activity_1" }] })
      .mockResolvedValueOnce({ ok: true, data: { id: "last_1" } });

    const mod = await import("@/lib/api/control-plane");

    await expect(mod.getMe()).resolves.toEqual({ tenantId: "ten_1" });
    await expect(mod.getDashboardScorecard()).resolves.toEqual({ score: 99 });
    await expect(mod.getDashboardSummary()).resolves.toEqual({ summary: true });
    await expect(mod.getDashboardHealth()).resolves.toEqual([{ subsystem: "runtime" }]);
    await expect(mod.getDashboardTrustVector()).resolves.toEqual({ trust: 98 });
    await expect(mod.getDashboardActivity()).resolves.toEqual([{ id: "activity_1" }]);
    await expect(mod.getDashboardLastIrreversible()).resolves.toEqual({ id: "last_1" });

    expect(get).toHaveBeenCalledWith("/v1/dashboard/activity", { params: { limit: 50 } });
    expect(get).toHaveBeenCalledWith("/v1/dashboard/scorecard", { params: { window: "60m" } });
  });

  it("throws when an envelope response reports failure", async () => {
    get.mockResolvedValueOnce({ ok: false, data: null, error: { message: "boom" } });
    const mod = await import("@/lib/api/control-plane");

    await expect(mod.getMe()).rejects.toThrow("boom");
  });

  it("passes through non-envelope reads and billing mutations", async () => {
    get
      .mockResolvedValueOnce([{ id: "ten_1" }])
      .mockResolvedValueOnce({ id: "overview_1" })
      .mockResolvedValueOnce([{ id: "key_1" }])
      .mockResolvedValueOnce({ tenantId: "ten_1", authorizedExecutions: 10 })
      .mockResolvedValueOnce({ planCode: "startup" });
    post
      .mockResolvedValueOnce({ checkout_url: "https://checkout" })
      .mockResolvedValueOnce({ portal_url: "https://portal" });

    const mod = await import("@/lib/api/control-plane");

    await expect(mod.listControlTenants()).resolves.toEqual([{ id: "ten_1" }]);
    await expect(mod.getTenantOverview("ten_1")).resolves.toEqual({ id: "overview_1" });
    await expect(mod.listApiKeys("ten_1")).resolves.toEqual([{ id: "key_1" }]);
    await expect(mod.getUsageSummary("ten_1")).resolves.toEqual({ tenantId: "ten_1", authorizedExecutions: 10 });
    await expect(mod.getBillingSummary("ten_1")).resolves.toEqual({ planCode: "startup" });

    await mod.createCheckoutSession({
      tenantId: "ten_1",
      planCode: "startup",
      successUrl: "http://localhost/success",
      cancelUrl: "http://localhost/cancel",
    });
    await mod.createPortalSession({
      tenantId: "ten_1",
      returnUrl: "http://localhost/return",
    });

    expect(post).toHaveBeenCalledWith("/v1/billing/checkout-session", {
      tenant_id: "ten_1",
      plan_code: "startup",
      success_url: "http://localhost/success",
      cancel_url: "http://localhost/cancel",
    });
    expect(post).toHaveBeenCalledWith("/v1/billing/portal-session", {
      tenant_id: "ten_1",
      return_url: "http://localhost/return",
    });
  });
});
