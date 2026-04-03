import { ApiClient } from "@/lib/api/client";
import { NetworkError, TimeoutError, ValidationError } from "@/lib/api/errors";

describe("ApiClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("builds requests with query params, correlation id, tenant id, and json parsing", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const client = new ApiClient({ baseUrl: "https://control.keon.systems/api/control", timeout: 1000, useMockFallback: false, liveMode: true });

    const result = await client.get<{ ok: boolean }>("/v1/me", {
      params: { window: "60m", limit: 5, disabled: false, ignored: undefined },
      tenantId: "ten_123",
      correlationId: "corr_123",
    });

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://control.keon.systems/v1/me?window=60m&limit=5&disabled=false",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "X-Correlation-Id": "corr_123",
          "X-Tenant-Id": "ten_123",
        }),
      }),
    );
  });

  it("serializes post bodies and returns text responses", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("created", {
        status: 201,
        headers: { "content-type": "text/plain" },
      }),
    );
    const client = new ApiClient({ baseUrl: "https://control.keon.systems/api/control", timeout: 1000, useMockFallback: false, liveMode: true });

    const result = await client.post<string>("/v1/items", { name: "item" });

    expect(result).toBe("created");
  });

  it("maps 400 responses to ValidationError", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "bad request" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      }),
    );
    const client = new ApiClient({ baseUrl: "https://control.keon.systems/api/control", timeout: 1000, useMockFallback: false, liveMode: true });

    await expect(client.get("/v1/items")).rejects.toBeInstanceOf(ValidationError);
  });

  it("maps fetch failures to NetworkError", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new TypeError("fetch failed"));
    const client = new ApiClient({ baseUrl: "https://control.keon.systems/api/control", timeout: 1000, useMockFallback: false, liveMode: true });

    await expect(client.get("/v1/items")).rejects.toBeInstanceOf(NetworkError);
  });

  it("times out requests when fetch never resolves", async () => {
    vi.useFakeTimers();
    vi.spyOn(global, "fetch").mockImplementation(() => new Promise(() => {}));
    const client = new ApiClient({ baseUrl: "https://control.keon.systems/api/control", timeout: 25, useMockFallback: false, liveMode: true });

    const promise = client.get("/v1/items");
    const assertion = expect(promise).rejects.toBeInstanceOf(TimeoutError);
    await vi.advanceTimersByTimeAsync(30);

    await assertion;
    vi.useRealTimers();
  });
});
