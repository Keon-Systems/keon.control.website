import { routeEventTopics } from "@/lib/realtime/routing";

describe("routeEventTopics", () => {
  it("returns the explicit topic when one is already present", () => {
    expect(routeEventTopics({ type: "ignored", timestamp: "2026-03-07T00:00:00Z", topic: "status", payload: {} })).toEqual(["status"]);
  });

  it("maps known event types to topics", () => {
    expect(routeEventTopics({ type: "alert.created", timestamp: "2026-03-07T00:00:00Z", payload: {} })).toEqual(["alerts"]);
    expect(routeEventTopics({ type: "status.update", timestamp: "2026-03-07T00:00:00Z", payload: {} })).toEqual(["status"]);
  });

  it("returns an empty array for unknown events", () => {
    expect(routeEventTopics({ type: "unknown.type", timestamp: "2026-03-07T00:00:00Z", payload: {} })).toEqual([]);
  });
});
