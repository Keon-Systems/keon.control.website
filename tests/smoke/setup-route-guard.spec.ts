import { expect, test } from "@playwright/test";

test("WELCOME-state user at /setup?step=goals is redirected to /welcome", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("keon.activation.provisioning-complete", "true");
    // No onboarding state → defaults to WELCOME
  });
  await page.goto("/setup?step=goals");
  await expect(page).toHaveURL(/\/welcome/);
});

test("completed user revisiting /setup?step=goals sees 'Basic setup complete' in header", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("keon.activation.provisioning-complete", "true");
    localStorage.setItem("keon.onboarding.state", JSON.stringify({
      currentStep: "READY",
      selectedGoals: ["govern-ai-actions"],
      workspaceId: "tenant_test",
      integrationStepCompleted: true,
      selectedIntegrationMode: "BYO_AI",
      guardrailPreset: "balanced",
      completed: true,
    }));
  });
  await page.goto("/setup?step=goals");
  await expect(page.getByRole("banner").getByText(/basic setup complete/i).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /what do you want to use keon for first/i })).toBeVisible();
});
