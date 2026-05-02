import { expect, test } from "@playwright/test";

test.skip(!process.env.BASE_URL, "BASE_URL is required for smoke tests.");

test("completing setup routes to /integrations, not /control", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("keon.activation.provisioning-complete", "true");
    // WELCOME state — full flow from here
  });
  await page.goto("/welcome");
  await page.getByRole("button", { name: /set up workspace/i }).click();

  // Step 1: goals
  await expect(page.getByRole("heading", { name: /what do you want to use keon for first/i })).toBeVisible();
  await page.getByRole("button", { name: /govern ai actions/i }).click();
  await page.getByRole("button", { name: /^continue$/i }).click();

  // Step 2: workspace (ONBOARDING_LOCAL_MODE skips API)
  await page.getByRole("button", { name: /confirm and continue/i }).click();

  // Step 3: integration — must select
  await page.getByRole("button", { name: /byo ai/i }).click();
  await page.getByRole("button", { name: /^continue$/i }).click();

  // Step 4: guardrails
  await page.getByRole("button", { name: /balanced/i }).click();
  await page.getByRole("button", { name: /review ready state/i }).click();

  // Complete step
  await expect(page.getByRole("heading", { name: /workspace prepared/i })).toBeVisible();
  await page.getByRole("button", { name: /connect your first integration/i }).click();
  await expect(page).toHaveURL(/\/integrations/);
});

test("upcoming checklist items are not clickable links", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("keon.activation.provisioning-complete", "true");
    localStorage.setItem("keon.onboarding.state", JSON.stringify({
      currentStep: "DEFINE_GOALS",
      selectedGoals: [],
      workspaceId: null,
      integrationStepCompleted: false,
      selectedIntegrationMode: null,
      guardrailPreset: null,
      completed: false,
    }));
  });
  await page.goto("/setup?step=goals");

  // "Set starter guardrails" and "Choose operating model" should be aria-disabled
  const guardrailsWrapper = page.locator('[aria-disabled="true"]').filter({ hasText: /set starter guardrails/i });
  await expect(guardrailsWrapper).toBeVisible();
  await expect(guardrailsWrapper).not.toHaveAttribute("href");
});
