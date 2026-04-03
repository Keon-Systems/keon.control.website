"use client";

import { useOnboardingState } from "@/lib/onboarding/store";
import { ArrivalStep } from "./steps/arrival-step";
import { CompleteStep } from "./steps/complete-step";
import { FirstGovernedActionStep } from "./steps/first-governed-action-step";
import { IntentSelectionStep } from "./steps/intent-selection-step";
import { PolicyBaselineStep } from "./steps/policy-baseline-step";
import { ScopeConfirmationStep } from "./steps/scope-confirmation-step";

export function OnboardingFlow() {
  const {
    state: { currentStep },
  } = useOnboardingState();

  switch (currentStep) {
    case "ARRIVAL":
      return <ArrivalStep />;
    case "INTENT_SELECTION":
      return <IntentSelectionStep />;
    case "SCOPE_CONFIRMATION":
      return <ScopeConfirmationStep />;
    case "POLICY_BASELINE":
      return <PolicyBaselineStep />;
    case "FIRST_GOVERNED_ACTION":
      return <FirstGovernedActionStep />;
    case "COMPLETE":
      return <CompleteStep />;
    default:
      return <ArrivalStep />;
  }
}
