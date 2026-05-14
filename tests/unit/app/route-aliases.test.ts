import { describe, expect, it } from "vitest";

async function expectRouteRedirect(importPage: () => Promise<{ default: () => unknown }>, destination: string) {
  const page = await importPage();
  try {
    page.default();
  } catch (error) {
    expect(error).toMatchObject({
      digest: expect.stringContaining(destination),
    });
    return;
  }

  throw new Error(`Expected route to redirect to ${destination}`);
}

describe("post-setup route aliases", () => {
  it("/workspace redirects to /control", async () => {
    await expectRouteRedirect(() => import("@/app/workspace/page"), "/control");
  });

  it("/guardrails redirects to /policies", async () => {
    await expectRouteRedirect(() => import("@/app/guardrails/page"), "/policies");
  });

  it("/diagnostics redirects to /cockpit", async () => {
    await expectRouteRedirect(() => import("@/app/diagnostics/page"), "/cockpit");
  });
});
