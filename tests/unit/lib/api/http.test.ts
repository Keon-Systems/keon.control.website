import { z } from "zod";
import { ApiError, fetchJson } from "@/lib/api/http";

describe("fetchJson", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches and validates JSON responses", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true, value: 42 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const result = await fetchJson(
      { baseUrl: "https://api.keon.test/api/v1", path: "/status" },
      z.object({ ok: z.boolean(), value: z.number() }),
    );

    expect(result).toEqual({ ok: true, value: 42 });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.keon.test/api/v1/status",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("resolves absolute urls unchanged and strips /api/v1 for root /api routes", async () => {
    const fetchMock = vi.spyOn(global, "fetch");
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await fetchJson(
      { baseUrl: "https://api.keon.test/api/v1", path: "/api/root" },
      z.object({ ok: z.boolean() }),
    );
    await fetchJson(
      { baseUrl: "https://api.keon.test/api/v1", path: "https://other.keon.test/absolute" },
      z.object({ ok: z.boolean() }),
    );

    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.keon.test/api/root");
    expect(fetchMock.mock.calls[1]?.[0]).toBe("https://other.keon.test/absolute");
  });

  it("throws ApiError with parsed error payload details on non-2xx responses", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "BAD_TENANT",
            message: "Tenant not found",
            details: { tenantId: "missing" },
          },
        }),
        {
          status: 404,
          statusText: "Not Found",
          headers: { "content-type": "application/json" },
        },
      ),
    );

    await expect(
      fetchJson({ baseUrl: "https://api.keon.test/api/v1", path: "/tenants/missing" }, z.object({})),
    ).rejects.toMatchObject({
      status: 404,
      code: "BAD_TENANT",
      message: "Tenant not found",
      details: { tenantId: "missing" },
    } satisfies Partial<ApiError>);
  });

  it("throws a schema mismatch error when response shape is invalid", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: "yes" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(
      fetchJson({ baseUrl: "https://api.keon.test/api/v1", path: "/status" }, z.object({ ok: z.boolean() })),
    ).rejects.toMatchObject({
      status: 500,
      code: "SCHEMA_MISMATCH",
    } satisfies Partial<ApiError>);
  });

  it("returns a raw-text payload when JSON parsing fails for an error response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("upstream exploded", {
        status: 502,
        statusText: "Bad Gateway",
        headers: { "content-type": "text/plain" },
      }),
    );

    await expect(
      fetchJson({ baseUrl: "https://api.keon.test/api/v1", path: "/status" }, z.object({ ok: z.boolean() })),
    ).rejects.toMatchObject({
      status: 502,
      code: "HTTP_ERROR",
    } satisfies Partial<ApiError>);
  });
});
