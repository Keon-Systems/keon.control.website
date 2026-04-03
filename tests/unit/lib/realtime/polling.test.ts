describe("pollTopic", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("returns mock events when dev realtime mock is enabled", async () => {
    process.env.NEXT_PUBLIC_DEV_REALTIME_MOCK = "true";
    const mod = await import("@/lib/realtime/polling");

    const events = await mod.pollTopic("alerts");

    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe("alert.created");
  });

  it("fetches events from the polling endpoint when mocks are disabled", async () => {
    process.env.NEXT_PUBLIC_DEV_REALTIME_MOCK = "false";
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ type: "status.update", timestamp: "2026-03-07T00:00:00Z", payload: { key: "activeExecutions", value: 12 } }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const mod = await import("@/lib/realtime/polling");

    const events = await mod.pollTopic("status");

    expect(events).toEqual([
      {
        type: "status.update",
        timestamp: "2026-03-07T00:00:00Z",
        payload: { key: "activeExecutions", value: 12 },
      },
    ]);
  });

  it("swallows fetch failures and returns an empty list", async () => {
    process.env.NEXT_PUBLIC_DEV_REALTIME_MOCK = "false";
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("boom"));
    const mod = await import("@/lib/realtime/polling");

    await expect(mod.pollTopic("status")).resolves.toEqual([]);
  });
});
