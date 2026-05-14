import { expect, test } from "@playwright/test";

test("first-run customer sees welcome, required setup, and ready state", async ({ page, baseURL }) => {
  test.skip(!baseURL, "BASE_URL is required for smoke tests.");

  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("keon.activation.provisioning-complete", "true");
  });
  await page.goto("/welcome");
  await expect(page.getByRole("heading", { name: /keon control makes ai-driven work accountable/i })).toBeVisible();
  await page.getByRole("button", { name: /set up workspace/i }).click();

  // Step 1: goals — outcome-first title
  await expect(page.getByRole("heading", { name: /what do you want to use keon for first/i })).toBeVisible();
  await page.getByRole("button", { name: /govern ai actions/i }).click();
  await page.getByRole("button", { name: /^continue$/i }).click();

  // Step 2: workspace
  await expect(page.getByRole("heading", { name: /confirm your workspace access/i })).toBeVisible();
  await page.getByRole("button", { name: /confirm and continue/i }).click();

  // Step 3: integration — must select a mode before Continue is enabled
  await expect(page.getByRole("heading", { name: /how do you want governed decisions to happen/i })).toBeVisible();
  await page.getByRole("button", { name: /byo ai/i }).click();
  await page.getByRole("button", { name: /^continue$/i }).click();

  // Lifecycle preview interlude
  await expect(page.getByRole("heading", { name: /every governed action follows the same lifecycle/i })).toBeVisible();
  await page.getByRole("button", { name: /continue to guardrails/i }).click();

  // Step 4: guardrails
  await expect(page.getByRole("heading", { name: /choose your starter guardrails/i })).toBeVisible();
  await page.getByRole("button", { name: /balanced/i }).click();
  await page.getByRole("button", { name: /review workspace/i }).click();

  // Complete step — new copy
  await expect(page.getByRole("heading", { name: /setup choices confirmed/i })).toBeVisible();
  await expect(page.getByRole("main").getByText(/basic setup complete/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /connect your first integration/i })).toBeVisible();
});
