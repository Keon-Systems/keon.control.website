class MockWebSocket {
  static OPEN = 1;
  static CONNECTING = 0;
  static instances: MockWebSocket[] = [];

  readyState = MockWebSocket.CONNECTING;
  sent: string[] = [];
  private listeners = new Map<string, Set<(event?: { data?: string }) => void>>();

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
  }

  addEventListener(type: string, handler: (event?: { data?: string }) => void) {
    const set = this.listeners.get(type) ?? new Set();
    set.add(handler);
    this.listeners.set(type, set);
  }

  emit(type: string, event?: { data?: string }) {
    this.listeners.get(type)?.forEach((handler) => handler(event));
  }

  send(payload: string) {
    this.sent.push(payload);
  }

  close() {
    this.readyState = 3;
    this.emit("close");
  }
}

describe("realtime client", () => {
  const originalWebSocket = globalThis.WebSocket;
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_REALTIME_ENABLED: "true",
      NEXT_PUBLIC_REALTIME_WS_URL: "ws://localhost:8787/ws",
    };
    MockWebSocket.instances = [];
    globalThis.WebSocket = MockWebSocket as never;
  });

  afterEach(() => {
    vi.useRealTimers();
    globalThis.WebSocket = originalWebSocket;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("connects, routes events, sends heartbeats, and disconnects", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { getRealtimeClient } = await import("@/lib/realtime/client");
    const client = getRealtimeClient();
    const statusHandler = vi.fn();
    const eventHandler = vi.fn();

    const unsubscribeStatus = client.subscribeStatus(statusHandler);
    client.subscribe("alerts", eventHandler);
    client.connect();

    const socket = MockWebSocket.instances[0];
    expect(socket?.url).toBe("ws://localhost:8787/ws");

    socket.readyState = MockWebSocket.OPEN;
    socket.emit("open");
    socket.emit("message", {
      data: JSON.stringify({
        type: "alert.created",
        timestamp: "2026-03-07T00:00:00Z",
        payload: { id: "alert_1" },
      }),
    });
    socket.emit("message", { data: "not-json" });
    socket.emit("message", { data: JSON.stringify({ type: "pong", payload: {} }) });

    await vi.advanceTimersByTimeAsync(25000);

    expect(statusHandler).toHaveBeenCalledWith("idle");
    expect(statusHandler).toHaveBeenCalledWith("connecting");
    expect(statusHandler).toHaveBeenCalledWith("connected");
    expect(eventHandler).toHaveBeenCalledWith({
      type: "alert.created",
      timestamp: "2026-03-07T00:00:00Z",
      payload: { id: "alert_1" },
    });
    expect(socket.sent[0]).toContain("\"type\":\"ping\"");
    expect(client.getStatus()).toBe("connected");

    unsubscribeStatus();
    client.disconnect();
    expect(client.getStatus()).toBe("disconnected");
    warnSpy.mockRestore();
  });

  it("schedules reconnects on close", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { getRealtimeClient } = await import("@/lib/realtime/client");
    const client = getRealtimeClient();

    client.connect();
    const socket = MockWebSocket.instances[0];
    socket.readyState = 3;
    socket.emit("close");

    expect(client.getStatus()).toBe("disconnected");
    await vi.advanceTimersByTimeAsync(1500);

    expect(MockWebSocket.instances.length).toBeGreaterThan(1);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
