import { describe, expect, it } from "vitest";
import { canAccessFirstRunStage, deriveFirstRunStatus, getFirstRunStageForRoute } from "@/lib/first-run/state";
import { defaultOnboardingState } from "@/lib/onboarding/state-machine";

describe("first-run state", () => {
  it("routes new users to activation until provisioning completes", () => {
    expect(
      deriveFirstRunStatus({
        provisioningComplete: false,
        onboardingState: defaultOnboardingState,
      })
    ).toMatchObject({
      provisioningComplete: false,
      onboardingComplete: false,
      readyState: false,
      nextRoute: "/activate",
      stage: "activate",
    });
  });

  it("routes provisioned users to welcome before setup starts", () => {
    expect(
      deriveFirstRunStatus({
        provisioningComplete: true,
        onboardingState: defaultOnboardingState,
      })
    ).toMatchObject({
      provisioningComplete: true,
      onboardingComplete: false,
      readyState: false,
      nextRoute: "/welcome",
      stage: "welcome",
    });
  });

  it("routes provisioned users in progress to the setup checklist", () => {
    expect(
      deriveFirstRunStatus({
        provisioningComplete: true,
        onboardingState: {
          ...defaultOnboardingState,
          currentStep: "CONFIRM_ACCESS",
          selectedGoals: ["govern-ai-actions"],
        },
      })
    ).toMatchObject({
      provisioningComplete: true,
      onboardingComplete: false,
      readyState: false,
      nextRoute: "/setup?step=access",
      stage: "setup",
    });
  });

  it("only marks the workspace ready after provisioning and onboarding are complete", () => {
    expect(
      deriveFirstRunStatus({
        provisioningComplete: true,
        onboardingState: {
          ...defaultOnboardingState,
          currentStep: "READY",
          selectedGoals: ["govern-ai-actions"],
          workspaceId: "tenant_123",
          guardrailPreset: "balanced",
          completed: true,
        },
      })
    ).toMatchObject({
      provisioningComplete: true,
      onboardingComplete: true,
      readyState: true,
      nextRoute: "/control",
      stage: "app",
    });
  });

  it("maps routes into canonical first-run stages", () => {
    expect(getFirstRunStageForRoute("/activate")).toBe("activate");
    expect(getFirstRunStageForRoute("/welcome")).toBe("welcome");
    expect(getFirstRunStageForRoute("/setup")).toBe("setup");
    expect(getFirstRunStageForRoute("/onboarding")).toBe("setup");
    expect(getFirstRunStageForRoute("/cockpit")).toBe("app");
  });

  it("blocks WELCOME-stage users from entering the setup route", () => {
    expect(
      canAccessFirstRunStage("setup", { provisioningComplete: true, stage: "welcome" })
    ).toBe(false);
  });

  it("allows setup-stage users to access the setup route", () => {
    expect(
      canAccessFirstRunStage("setup", { provisioningComplete: true, stage: "setup" })
    ).toBe(true);
  });

  it("allows app-stage users to revisit the setup route", () => {
    expect(
      canAccessFirstRunStage("setup", { provisioningComplete: true, stage: "app" })
    ).toBe(true);
  });

  it("allows activate-stage users to access the activate route", () => {
    expect(
      canAccessFirstRunStage("activate", { provisioningComplete: false, stage: "activate" })
    ).toBe(true);
  });

  it("blocks setup-stage users from the activate route", () => {
    expect(
      canAccessFirstRunStage("activate", { provisioningComplete: true, stage: "setup" })
    ).toBe(false);
  });
});
