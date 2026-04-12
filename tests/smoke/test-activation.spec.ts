import { expect, test } from "@playwright/test";

test("internal test activation stays visibly labeled through onboarding and app shell", async ({ page }) => {
  await page.context().addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  await page.goto("/activate?token=internal-test-token");

  await expect(page.getByText(/test activation mode/i).first()).toBeVisible();
  await expect(page.getByTestId("test-activation-badge")).toBeVisible();

  await page.waitForURL("**/welcome", { timeout: 20_000 });
  await expect(
    page.getByRole("heading", { name: /keon control makes ai-driven work accountable/i })
  ).toBeVisible();

  await page.getByRole("button", { name: /set up workspace/i }).click();
  await expect(page.getByRole("heading", { name: /what do you want to use keon for first/i })).toBeVisible();

  await page.getByRole("button", { name: /review important ai actions/i }).click();
  await page.getByRole("button", { name: /^continue$/i }).click();

  await expect(page.getByRole("heading", { name: /confirm your workspace access/i })).toBeVisible();
  await expect(page.getByText(/test activation mode/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /^production$/i })).toBeDisabled();

  await page.getByRole("button", { name: /confirm and continue/i }).click();

  await expect(page.getByRole("heading", { name: /choose your starter guardrails/i })).toBeVisible();
  await page.getByRole("button", { name: /balanced/i }).click();
  await page.getByRole("button", { name: /review ready state/i }).click();

  await expect(page.getByRole("heading", { name: /your workspace is ready/i })).toBeVisible();
  await page.getByRole("button", { name: /open workspace overview/i }).click();

  await page.waitForURL("**/control", { timeout: 10_000 });
  await expect(page.getByText(/test activation mode/i)).toBeVisible();
  await expect(
    page.getByText(/workspace:\s*keon internal test workspace/i).first()
  ).toBeVisible();
});
