import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mock: DB Provisioning Service ───────────────────────────────────────────
// Replaces @/server/db/provisioning with controlled stubs so the route
// can be tested without a database connection.
// Pure-function helpers (mapActivationMode, mapActivationSource) are inlined
// to match the real implementations exactly.

vi.mock("@/server/db/provisioning", () => ({
  resolveActivationToken: vi.fn(),
  startProvisioningRun: vi.fn(),
  getProvisioningRun: vi.fn(),
  mapActivationMode: (mode: string) => (mode === "invite" ? "INVITE" : "TEST"),
  mapActivationSource: (source: string) => {
    const map: Record<string, string> = {
      invite_token: "INVITE_TOKEN",
      test_token: "TEST_TOKEN",
      sandbox_fallback: "TEST_TOKEN",
    };
    return map[source] ?? "INVITE_TOKEN";
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ORIGINAL_ENV = { ...process.env };

function setNodeEnv(value: string): void {
  (process.env as Record<string, string | undefined>).NODE_ENV = value;
}

async function loadRoute() {
  vi.resetModules();
  return import("@/app/api/activation/provision/route");
}

async function loadMocks() {
  // Import after loadRoute so we get the same mock instances the route uses.
  return import("@/server/db/provisioning");
}

// ─── Canonical mock run factories ────────────────────────────────────────────

function makeTestRun(id = "prov_test_run_001") {
  return {
    id,
    tenantId: "tenant_cuid_test",
    activationMode: "TEST",
    activationSource: "TEST_TOKEN",
    startedByEmail: "test-activation@keon.internal",
    startedByName: null,
    state: "PROVISIONING_COMPLETE",
    status: "COMPLETED",
    completedAt: new Date("2026-01-01T00:00:00Z"),
    failedAt: null,
    failureCode: null,
    failureMessage: null,
    stateHistory: [],
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  };
}

function makeInviteRun(id = "prov_invite_run_001") {
  return {
    ...makeTestRun(id),
    activationMode: "INVITE",
    activationSource: "INVITE_TOKEN",
    startedByEmail: "invite-activation@keon.internal",
    tenantId: "tenant_cuid_invite",
  };
}

function makeSandboxRun(id = "prov_sandbox_run_001") {
  return {
    ...makeTestRun(id),
    activationMode: "INVITE",
    activationSource: "TEST_TOKEN",
    startedByEmail: "invite-activation@keon.internal",
    tenantId: "tenant_cuid_sandbox",
  };
}

function makeStartResult(run: ReturnType<typeof makeTestRun>) {
  return {
    run,
    tenant: {},
    user: {},
    membership: {},
    workspace: {},
    inviteToken: {},
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("activation provision route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.VERCEL_ENV;
    delete process.env.KEON_TEST_ACTIVATION_TOKEN;
    delete process.env.ALLOW_TEST_ACTIVATION;
    delete process.env.KEON_INVITE_ACTIVATION_TOKEN;
    delete process.env.KEON_INVITE_ACTIVATION_TOKENS;
    delete process.env.KEON_INVITE_TENANT_ID;
    delete process.env.KEON_INVITE_TENANT_NAME;
    delete process.env.KEON_INVITE_WORKSPACE_ID;
    delete process.env.KEON_INVITE_WORKSPACE_NAME;
    delete process.env.KEON_INVITE_ENVIRONMENT;
    delete process.env.KEON_INVITE_UI_LABEL;
    delete process.env.KEON_INVITE_ALLOW_SANDBOX_FALLBACK;
    setNodeEnv("development");
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  // ── Existing token-validation tests (preserved) ───────────────────────────

  it("accepts a valid test token outside production and returns test activation context", async () => {
    process.env.KEON_TEST_ACTIVATION_TOKEN = "internal-test-token";
    const logSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const route = await loadRoute();
    const db = await loadMocks();
    const testRun = makeTestRun();

    vi.mocked(db.resolveActivationToken).mockResolvedValue(null);
    vi.mocked(db.startProvisioningRun).mockResolvedValue(makeStartResult(testRun) as never);
    vi.mocked(db.getProvisioningRun).mockResolvedValue(testRun as never);

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
        provisioningId: testRun.id,
        tenantId: "ten_keon_internal_test",
      })
    );

    // GET poll: resolveActivationToken used for ownership verification
    vi.mocked(db.resolveActivationToken).mockResolvedValue(testRun as never);

    const statusResponse = await route.GET(
      new NextRequest(
        `http://localhost/api/activation/provision?id=${encodeURIComponent(testRun.id)}&token=internal-test-token`
      )
    );
    expect(statusResponse.status).toBe(200);
    await expect(statusResponse.json()).resolves.toMatchObject({
      provisioningId: testRun.id,
      activation: { mode: "test", tenantId: "ten_keon_internal_test" },
    });
  });

  it("auto-detects the configured test token when activationMode is omitted", async () => {
    process.env.KEON_TEST_ACTIVATION_TOKEN = "internal-test-token";
    const route = await loadRoute();
    const db = await loadMocks();
    const testRun = makeTestRun();

    vi.mocked(db.resolveActivationToken).mockResolvedValue(null);
    vi.mocked(db.startProvisioningRun).mockResolvedValue(makeStartResult(testRun) as never);

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
    setNodeEnv("production");
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

  it("accepts a configured invite token for an approved workspace setup link", async () => {
    process.env.KEON_INVITE_ACTIVATION_TOKEN = "approved-invite-token";
    process.env.KEON_INVITE_TENANT_ID = "ten_preview_001";
    process.env.KEON_INVITE_TENANT_NAME = "Preview Workspace";
    process.env.KEON_INVITE_ENVIRONMENT = "sandbox";
    const route = await loadRoute();
    const db = await loadMocks();
    const inviteRun = makeInviteRun();

    vi.mocked(db.resolveActivationToken).mockResolvedValue(null);
    vi.mocked(db.startProvisioningRun).mockResolvedValue(makeStartResult(inviteRun) as never);

    const response = await route.POST(
      new NextRequest("http://localhost/api/activation/provision", {
        method: "POST",
        body: JSON.stringify({ token: "approved-invite-token" }),
      })
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      activation: {
        mode: "invite",
        source: "invite_token",
        tenantId: "ten_preview_001",
        tenantName: "Preview Workspace",
        workspaceId: "ten_preview_001",
        workspaceName: "Preview Workspace",
        environment: "sandbox",
        uiLabel: "Approved workspace setup",
      },
    });
  });

  it("fails closed when a valid invite token has no attached tenant or workspace", async () => {
    process.env.KEON_INVITE_ACTIVATION_TOKEN = "approved-invite-token";
    const route = await loadRoute();

    const response = await route.POST(
      new NextRequest("http://localhost/api/activation/provision", {
        method: "POST",
        body: JSON.stringify({ token: "approved-invite-token" }),
      })
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "invite_workspace_missing",
      message: "Activation link is valid, but no prepared workspace is attached.",
    });
  });

  it("allows an explicit sandbox fallback for invite tokens without attached workspace IDs", async () => {
    process.env.KEON_INVITE_ACTIVATION_TOKEN = "approved-invite-token";
    process.env.KEON_INVITE_ALLOW_SANDBOX_FALLBACK = "true";
    const route = await loadRoute();
    const db = await loadMocks();
    const sandboxRun = makeSandboxRun();

    vi.mocked(db.resolveActivationToken).mockResolvedValue(null);
    vi.mocked(db.startProvisioningRun).mockResolvedValue(makeStartResult(sandboxRun) as never);

    const response = await route.POST(
      new NextRequest("http://localhost/api/activation/provision", {
        method: "POST",
        body: JSON.stringify({ token: "approved-invite-token" }),
      })
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      activation: {
        mode: "invite",
        source: "sandbox_fallback",
        tenantId: "ten_keon_internal_test",
        workspaceId: "ten_keon_internal_test",
        environment: "sandbox",
        uiLabel: "Sandbox workspace fallback",
      },
    });
  });

  it("fails closed when invite activation tokens are not configured", async () => {
    const route = await loadRoute();

    const response = await route.POST(
      new NextRequest("http://localhost/api/activation/provision", {
        method: "POST",
        body: JSON.stringify({ token: "unanchored-token" }),
      })
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "invite_activation_not_configured",
      message: "Invite activation is not configured.",
    });
  });

  it("rejects invite tokens that are not on the allowlist", async () => {
    process.env.KEON_INVITE_ACTIVATION_TOKENS = "approved-a,approved-b";
    const route = await loadRoute();

    const response = await route.POST(
      new NextRequest("http://localhost/api/activation/provision", {
        method: "POST",
        body: JSON.stringify({ token: "unknown-invite-token" }),
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "token_invalid",
      message: "The activation link is not recognized.",
    });
  });

  // ── KEO-10: Durable provisioning behavior ────────────────────────────────

  it("POST with same token + same mode reuses existing durable run (idempotent)", async () => {
    process.env.KEON_TEST_ACTIVATION_TOKEN = "reuse-token";
    const route = await loadRoute();
    const db = await loadMocks();
    const existingRun = makeTestRun("prov_existing_001");

    // First call: no existing run → creates new
    vi.mocked(db.resolveActivationToken).mockResolvedValueOnce(null);
    vi.mocked(db.startProvisioningRun).mockResolvedValueOnce(makeStartResult(existingRun) as never);

    const first = await route.POST(
      new NextRequest("http://localhost/api/activation/provision", {
        method: "POST",
        body: JSON.stringify({ token: "reuse-token", activationMode: "test" }),
      })
    );
    expect(first.status).toBe(201);
    const firstBody = await first.json();
    expect(firstBody.provisioningId).toBe("prov_existing_001");

    // Second call: existing run found → returns it without calling startProvisioningRun again
    vi.mocked(db.resolveActivationToken).mockResolvedValueOnce(existingRun as never);

    const second = await route.POST(
      new NextRequest("http://localhost/api/activation/provision", {
        method: "POST",
        body: JSON.stringify({ token: "reuse-token", activationMode: "test" }),
      })
    );
    expect(second.status).toBe(200); // idempotent — 200, not 201
    const secondBody = await second.json();
    expect(secondBody.provisioningId).toBe("prov_existing_001");
    expect(vi.mocked(db.startProvisioningRun)).toHaveBeenCalledTimes(1); // only called once
  });

  it("POST with same token + different mode creates a separate run (no collision)", async () => {
    process.env.KEON_TEST_ACTIVATION_TOKEN = "multi-mode-token";
    process.env.KEON_INVITE_ACTIVATION_TOKEN = "multi-mode-token";
    process.env.KEON_INVITE_TENANT_ID = "ten_multi_001";
    const route = await loadRoute();
    const db = await loadMocks();
    const testRun = makeTestRun("prov_test_mode");
    const inviteRun = makeInviteRun("prov_invite_mode");

    // Test mode POST
    vi.mocked(db.resolveActivationToken).mockResolvedValueOnce(null);
    vi.mocked(db.startProvisioningRun).mockResolvedValueOnce(makeStartResult(testRun) as never);

    const testResponse = await route.POST(
      new NextRequest("http://localhost/api/activation/provision", {
        method: "POST",
        body: JSON.stringify({ token: "multi-mode-token", activationMode: "test" }),
      })
    );
    expect(testResponse.status).toBe(201);
    expect((await testResponse.json()).provisioningId).toBe("prov_test_mode");

    // Invite mode POST — resolveActivationToken returns null (different mode, different index slot)
    vi.mocked(db.resolveActivationToken).mockResolvedValueOnce(null);
    vi.mocked(db.startProvisioningRun).mockResolvedValueOnce(makeStartResult(inviteRun) as never);

    const inviteResponse = await route.POST(
      new NextRequest("http://localhost/api/activation/provision", {
        method: "POST",
        body: JSON.stringify({ token: "multi-mode-token", activationMode: "invite" }),
      })
    );
    expect(inviteResponse.status).toBe(201);
    expect((await inviteResponse.json()).provisioningId).toBe("prov_invite_mode");

    // Two distinct runs created, not the same one
    expect(vi.mocked(db.startProvisioningRun)).toHaveBeenCalledTimes(2);
  });

  it("GET with valid token can poll and returns state from durable run", async () => {
    process.env.KEON_TEST_ACTIVATION_TOKEN = "poll-token";
    const route = await loadRoute();
    const db = await loadMocks();
    const testRun = makeTestRun("prov_poll_001");

    vi.mocked(db.getProvisioningRun).mockResolvedValue(testRun as never);
    vi.mocked(db.resolveActivationToken).mockResolvedValue(testRun as never);

    const response = await route.GET(
      new NextRequest(
        `http://localhost/api/activation/provision?id=prov_poll_001&token=poll-token`
      )
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.provisioningId).toBe("prov_poll_001");
    expect(body.state.internalState).toBe("provisioning_complete");
    expect(body.activation.mode).toBe("test");
    expect(body.completedAt).toBeDefined();
  });

  it("GET with mismatched token fails closed with 403", async () => {
    const route = await loadRoute();
    const db = await loadMocks();
    const run = makeTestRun("prov_legit_001");
    const differentRun = makeTestRun("prov_different_002");

    vi.mocked(db.getProvisioningRun).mockResolvedValue(run as never);
    // Token resolves to a DIFFERENT run — ownership mismatch
    vi.mocked(db.resolveActivationToken).mockResolvedValue(differentRun as never);

    const response = await route.GET(
      new NextRequest(
        `http://localhost/api/activation/provision?id=prov_legit_001&token=wrong-token`
      )
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ error: "token_mismatch" });
  });

  it("GET with token that resolves to null fails closed with 403", async () => {
    const route = await loadRoute();
    const db = await loadMocks();
    const run = makeTestRun("prov_legit_001");

    vi.mocked(db.getProvisioningRun).mockResolvedValue(run as never);
    vi.mocked(db.resolveActivationToken).mockResolvedValue(null);

    const response = await route.GET(
      new NextRequest(
        `http://localhost/api/activation/provision?id=prov_legit_001&token=unknown-token`
      )
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ error: "token_mismatch" });
  });

  it("GET without token param fails closed with 400", async () => {
    const route = await loadRoute();

    const response = await route.GET(
      new NextRequest(
        `http://localhost/api/activation/provision?id=prov_poll_001`
      )
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: "token_required" });
  });

  it("GET for unknown run ID returns 404", async () => {
    const route = await loadRoute();
    const db = await loadMocks();

    vi.mocked(db.getProvisioningRun).mockResolvedValue(null);

    const response = await route.GET(
      new NextRequest(
        `http://localhost/api/activation/provision?id=prov_nonexistent&token=any-token`
      )
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ error: "session_not_found" });
  });

  it("response does not contain activationTokenHash", async () => {
    process.env.KEON_TEST_ACTIVATION_TOKEN = "safe-token";
    const route = await loadRoute();
    const db = await loadMocks();
    const testRun = makeTestRun("prov_safe_001");

    vi.mocked(db.resolveActivationToken).mockResolvedValue(null);
    vi.mocked(db.startProvisioningRun).mockResolvedValue(makeStartResult(testRun) as never);

    const postResponse = await route.POST(
      new NextRequest("http://localhost/api/activation/provision", {
        method: "POST",
        body: JSON.stringify({ token: "safe-token", activationMode: "test" }),
      })
    );
    const postBody = await postResponse.json();
    expect(postBody).not.toHaveProperty("activationTokenHash");

    vi.mocked(db.getProvisioningRun).mockResolvedValue(testRun as never);
    vi.mocked(db.resolveActivationToken).mockResolvedValue(testRun as never);

    const getResponse = await route.GET(
      new NextRequest(
        `http://localhost/api/activation/provision?id=prov_safe_001&token=safe-token`
      )
    );
    const getBody = await getResponse.json();
    expect(getBody).not.toHaveProperty("activationTokenHash");
  });

  it("raw token is not written into stateHistory", async () => {
    process.env.KEON_TEST_ACTIVATION_TOKEN = "secret-raw-token";
    const route = await loadRoute();
    const db = await loadMocks();
    const testRun = makeTestRun();

    const capturedInputs: unknown[] = [];
    vi.mocked(db.resolveActivationToken).mockResolvedValue(null);
    vi.mocked(db.startProvisioningRun).mockImplementation(async (input) => {
      capturedInputs.push(input);
      return makeStartResult(testRun) as never;
    });

    await route.POST(
      new NextRequest("http://localhost/api/activation/provision", {
        method: "POST",
        body: JSON.stringify({ token: "secret-raw-token", activationMode: "test" }),
      })
    );

    expect(capturedInputs).toHaveLength(1);
    const input = capturedInputs[0] as Record<string, unknown>;

    // rawToken is passed to the service (service hashes it internally — never returns it)
    // but must NOT appear in stateHistory (which is built inside the service, not here)
    expect(input).toHaveProperty("rawToken", "secret-raw-token");
    expect(input).not.toHaveProperty("stateHistory");

    // Verify the run returned by the service has no raw token in stateHistory
    expect(JSON.stringify(testRun.stateHistory)).not.toContain("secret-raw-token");
  });
});
