import { NextRequest } from "next/server";

const completeCheckoutSession = vi.fn();

vi.mock("@/lib/server/control-plane", () => ({
  completeCheckoutSession,
}));

describe("mock checkout route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to cancel when session id is missing", async () => {
    const route = await import("@/app/api/control/mock/checkout/route");
    const response = await route.GET(new NextRequest("http://localhost/api/control/mock/checkout"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/billing/cancel?error=missing-session");
  });

  it("redirects to success and cancel paths based on the selected action", async () => {
    completeCheckoutSession
      .mockResolvedValueOnce({ id: "cs_1", tenantId: "ten_1" })
      .mockResolvedValueOnce({ id: "cs_2", tenantId: "ten_2" });

    const route = await import("@/app/api/control/mock/checkout/route");
    const successResponse = await route.GET(
      new NextRequest("http://localhost/api/control/mock/checkout?session_id=cs_1"),
    );
    const cancelResponse = await route.GET(
      new NextRequest("http://localhost/api/control/mock/checkout?session_id=cs_2&action=cancel"),
    );

    expect(successResponse.headers.get("location")).toContain("/billing/success?session_id=cs_1&tenant_id=ten_1");
    expect(cancelResponse.headers.get("location")).toContain("/billing/cancel?session_id=cs_2&tenant_id=ten_2");
  });

  it("redirects to cancel when the session cannot be completed", async () => {
    completeCheckoutSession.mockRejectedValueOnce(new Error("bad session"));
    const route = await import("@/app/api/control/mock/checkout/route");
    const response = await route.GET(
      new NextRequest("http://localhost/api/control/mock/checkout?session_id=bad"),
    );

    expect(response.headers.get("location")).toContain("/billing/cancel?error=invalid-session");
  });
});
