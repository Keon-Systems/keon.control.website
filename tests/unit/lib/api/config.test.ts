describe("api config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_APP_ORIGIN;
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    delete process.env.NEXT_PUBLIC_API_TIMEOUT;
    delete process.env.NEXT_PUBLIC_API_USE_MOCK_FALLBACK;
    delete process.env.NEXT_PUBLIC_API_LIVE_MODE;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("uses defaults when env vars are absent", async () => {
    const mod = await import("@/lib/api/config");
    expect(mod.getApiConfig()).toEqual({
      baseUrl: "http://localhost:3000/api/control",
      timeout: 10000,
      useMockFallback: true,
      liveMode: false,
    });
  });

  it("derives api config from environment variables", async () => {
    process.env.NEXT_PUBLIC_APP_ORIGIN = "https://control.keon.systems/";
    process.env.NEXT_PUBLIC_API_TIMEOUT = "2500";
    process.env.NEXT_PUBLIC_API_USE_MOCK_FALLBACK = "false";
    process.env.NEXT_PUBLIC_API_LIVE_MODE = "true";

    const mod = await import("@/lib/api/config");
    expect(mod.getApiConfig()).toEqual({
      baseUrl: "https://control.keon.systems/api/control",
      timeout: 2500,
      useMockFallback: false,
      liveMode: true,
    });
  });
});
