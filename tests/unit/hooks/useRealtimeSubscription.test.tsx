import { renderHook, waitFor } from "@testing-library/react";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

const realtimeMocks = vi.hoisted(() => ({
  connect: vi.fn(),
  subscribe: vi.fn(),
  subscribeStatus: vi.fn(),
  getStatus: vi.fn(),
  pollTopic: vi.fn(),
}));

vi.mock("@/lib/realtime", () => ({
  REALTIME_CONFIG: {
    REALTIME_ENABLED: false,
    POLL_INTERVAL_MS: 50,
  },
  getRealtimeClient: () => ({
    connect: realtimeMocks.connect,
    subscribe: realtimeMocks.subscribe,
    subscribeStatus: realtimeMocks.subscribeStatus,
    getStatus: realtimeMocks.getStatus,
  }),
  pollTopic: realtimeMocks.pollTopic,
}));

describe("useRealtimeSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    realtimeMocks.getStatus.mockReturnValue("idle");
    realtimeMocks.subscribe.mockReturnValue(() => {});
    realtimeMocks.subscribeStatus.mockImplementation((handler: (status: string) => void) => {
      handler("idle");
      return () => {};
    });
    realtimeMocks.pollTopic.mockResolvedValue([
      { type: "status.update", timestamp: "2026-03-07T00:00:00Z", payload: { key: "activeExecutions", value: 12 } },
    ]);
  });

  it("connects the realtime client and falls back to polling when realtime is disabled", async () => {
    const onEvent = vi.fn();
    const { result } = renderHook(() =>
      useRealtimeSubscription({
        topic: "status",
        onEvent,
      }),
    );

    await waitFor(() => {
      expect(onEvent).toHaveBeenCalledWith({
        type: "status.update",
        timestamp: "2026-03-07T00:00:00Z",
        payload: { key: "activeExecutions", value: 12 },
      });
    });

    expect(realtimeMocks.connect).toHaveBeenCalled();
    expect(result.current.usingPolling).toBe(true);
    expect(result.current.status).toBe("idle");
  });

  it("stays inert when disabled", async () => {
    const onEvent = vi.fn();
    const { result } = renderHook(() =>
      useRealtimeSubscription({
        topic: "alerts",
        onEvent,
        enabled: false,
      }),
    );

    await waitFor(() => {
      expect(result.current.usingPolling).toBe(false);
    });

    expect(realtimeMocks.connect).not.toHaveBeenCalled();
    expect(onEvent).not.toHaveBeenCalled();
  });
});
