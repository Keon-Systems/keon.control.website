import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

async function loadRoute() {
  vi.resetModules();
  return import("@/app/api/activation/provision/route");
}

describe("activation provision route", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.VERCEL_ENV;
    delete process.env.KEON_TEST_ACTIVATION_TOKEN;
    delete process.env.ALLOW_TEST_ACTIVATION;
    process.env.NODE_ENV = "development";
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  it("accepts a valid test token outside production and returns test activation context", async () => {
    process.env.KEON_TEST_ACTIVATION_TOKEN = "internal-test-token";
    const logSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const route = await loadRoute();

    const startResponse = await route.POST(
      new NextRequest("http://localhost/api/activation/provision", {
        method: "POST",
        body: JSON.stringify({ token: "internal-test-token", activationMode: "test" }),
      })
    );

    expect(startResponse.status).toBe(201);
    const startBody = await startResponse.json();
    expect(startBody.activation).toMatchObject({
      mode: "test",
      source: "test_token",
      tenantId: "ten_keon_internal_test",
      uiLabel: "Test activation mode",
    });
    expect(logSpy).toHaveBeenCalledWith(
      "[activation] accepted internal test activation token",
      expect.objectContaining({
        provisioningId: startBody.provisioningId,
        tenantId: "ten_keon_internal_test",
      })
    );

    const statusResponse = await route.GET(
      new NextRequest(
        `http://localhost/api/activation/provision?id=${encodeURIComponent(startBody.provisioningId)}`
      )
    );
    expect(statusResponse.status).toBe(200);
    await expect(statusResponse.json()).resolves.toMatchObject({
      provisioningId: startBody.provisioningId,
      activation: { mode: "test", tenantId: "ten_keon_internal_test" },
    });
  });

  it("auto-detects the configured test token when activationMode is omitted", async () => {
    process.env.KEON_TEST_ACTIVATION_TOKEN = "internal-test-token";
    const route = await loadRoute();

    const response = await route.POST(
      new NextRequest("http://localhost/api/activation/provision", {
        method: "POST",
        body: JSON.stringify({ token: "internal-test-token" }),
      })
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      activation: { mode: "test", source: "test_token" },
    });
  });

  it("rejects an invalid explicit test token", async () => {
    process.env.KEON_TEST_ACTIVATION_TOKEN = "expected-test-token";
    const route = await loadRoute();

    const response = await route.POST(
      new NextRequest("http://localhost/api/activation/provision", {
        method: "POST",
        body: JSON.stringify({ token: "wrong-token", activationMode: "test" }),
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "token_invalid",
      message: "The test activation token is invalid.",
    });
  });

  it("disables test activation in production unless explicitly allowed", async () => {
    process.env.NODE_ENV = "production";
    process.env.KEON_TEST_ACTIVATION_TOKEN = "expected-test-token";
    delete process.env.ALLOW_TEST_ACTIVATION;
    const route = await loadRoute();

    const response = await route.POST(
      new NextRequest("http://localhost/api/activation/provision", {
        method: "POST",
        body: JSON.stringify({ token: "expected-test-token", activationMode: "test" }),
      })
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "activation_test_token_disabled",
      message: "Test activation tokens are disabled in production.",
    });
  });
});
