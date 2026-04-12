"use client";

import { clampVisibleStep } from "@/lib/onboarding/experience";
import { useOnboardingState } from "@/lib/onboarding/store";
import { useSearchParams } from "next/navigation";
import { CompleteStep } from "./steps/complete-step";
import { IntegrationSelectionStep } from "./steps/integration-selection-step";
import { IntentSelectionStep } from "./steps/intent-selection-step";
import { PolicyBaselineStep } from "./steps/policy-baseline-step";
import { ScopeConfirmationStep } from "./steps/scope-confirmation-step";

export function OnboardingFlow() {
  const searchParams = useSearchParams();
  const { state } = useOnboardingState();
  const visibleStep = clampVisibleStep(searchParams.get("step"), state);

  switch (visibleStep) {
    case "DEFINE_GOALS":
      return <IntentSelectionStep />;
    case "CONFIRM_ACCESS":
      return <ScopeConfirmationStep />;
    case "SELECT_INTEGRATION":
      return <IntegrationSelectionStep />;
    case "SET_GUARDRAILS":
      return <PolicyBaselineStep />;
    case "READY":
      return <CompleteStep />;
    default:
      return <IntentSelectionStep />;
  }
}
