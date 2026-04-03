import { buildMockEvent } from "@/lib/realtime/mock";

describe("buildMockEvent", () => {
  it("builds alert events", () => {
    const event = buildMockEvent("alerts");
    expect(event.type).toBe("alert.created");
    expect(event.timestamp).toBeTruthy();
  });

  it("builds incident events", () => {
    const event = buildMockEvent("incident-events");
    expect(event.type).toBe("incident.event");
    expect((event.payload as { subsystem: string }).subsystem).toBeTruthy();
  });

  it("builds trust events", () => {
    const event = buildMockEvent("incident-trust");
    expect(event.type).toBe("incident.trust");
    expect((event.payload as { trustScore: number }).trustScore).toBeGreaterThanOrEqual(40);
  });

  it("builds status events", () => {
    const event = buildMockEvent("status");
    expect(event.type).toBe("status.update");
    expect((event.payload as { key: string }).key).toBeTruthy();
  });
});
