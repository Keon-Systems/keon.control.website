export const onboardingSteps = [
  "ARRIVAL",
  "INTENT_SELECTION",
  "SCOPE_CONFIRMATION",
  "POLICY_BASELINE",
  "FIRST_GOVERNED_ACTION",
  "COMPLETE",
] as const;

export type OnboardingStep = (typeof onboardingSteps)[number];

export const onboardingIntentOptions = [
  "govern-ai-actions",
  "memory-and-context",
  "oversight-and-collaboration",
] as const;

export type OnboardingIntent = (typeof onboardingIntentOptions)[number];

export const policyBaselineOptions = ["strict", "balanced", "flexible"] as const;

export type PolicyBaseline = (typeof policyBaselineOptions)[number];

export interface OnboardingState {
  currentStep: OnboardingStep;
  selectedIntent: OnboardingIntent[];
  tenantId: string | null;
  policyBaseline: PolicyBaseline | null;
  completed: boolean;
}

export type OnboardingEvent =
  | { type: "HYDRATE"; payload: Partial<OnboardingState> }
  | { type: "BEGIN_SETUP" }
  | { type: "SAVE_INTENT_SELECTION"; payload: { selectedIntent: OnboardingIntent[] } }
  | { type: "CONFIRM_SCOPE"; payload: { tenantId: string } }
  | { type: "APPLY_POLICY_BASELINE"; payload: { policyBaseline: PolicyBaseline } }
  | { type: "COMPLETE_FIRST_GOVERNED_ACTION" }
  | { type: "FINISH_ONBOARDING" }
  | { type: "RESET" };

export const defaultOnboardingState: OnboardingState = {
  currentStep: "ARRIVAL",
  selectedIntent: [],
  tenantId: null,
  policyBaseline: null,
  completed: false,
};

export function isOnboardingStep(value: unknown): value is OnboardingStep {
  return typeof value === "string" && onboardingSteps.includes(value as OnboardingStep);
}

export function isOnboardingIntent(value: unknown): value is OnboardingIntent {
  return typeof value === "string" && onboardingIntentOptions.includes(value as OnboardingIntent);
}

export function isPolicyBaseline(value: unknown): value is PolicyBaseline {
  return typeof value === "string" && policyBaselineOptions.includes(value as PolicyBaseline);
}

export function sanitizeOnboardingState(input: Partial<OnboardingState> | null | undefined): OnboardingState {
  const selectedIntent = Array.isArray(input?.selectedIntent)
    ? input.selectedIntent.filter(isOnboardingIntent)
    : [];

  const tenantId = typeof input?.tenantId === "string" && input.tenantId.length > 0 ? input.tenantId : null;
  const policyBaseline = isPolicyBaseline(input?.policyBaseline) ? input.policyBaseline : null;
  const completed = input?.completed === true;
  const currentStep = completed
    ? "COMPLETE"
    : isOnboardingStep(input?.currentStep)
      ? input.currentStep
      : defaultOnboardingState.currentStep;

  return {
    currentStep,
    selectedIntent,
    tenantId,
    policyBaseline,
    completed,
  };
}

export function getCurrentStepIndex(step: OnboardingStep) {
  return onboardingSteps.indexOf(step);
}

export function transitionOnboardingState(state: OnboardingState, event: OnboardingEvent): OnboardingState {
  switch (event.type) {
    case "HYDRATE": {
      return sanitizeOnboardingState({
        ...state,
        ...event.payload,
      });
    }
    case "BEGIN_SETUP": {
      if (state.currentStep !== "ARRIVAL" || state.completed) {
        return state;
      }

      return {
        ...state,
        currentStep: "INTENT_SELECTION",
      };
    }
    case "SAVE_INTENT_SELECTION": {
      if (state.currentStep !== "INTENT_SELECTION" || event.payload.selectedIntent.length === 0) {
        return state;
      }

      return {
        ...state,
        selectedIntent: event.payload.selectedIntent,
        currentStep: "SCOPE_CONFIRMATION",
      };
    }
    case "CONFIRM_SCOPE": {
      if (state.currentStep !== "SCOPE_CONFIRMATION" || state.selectedIntent.length === 0) {
        return state;
      }

      return {
        ...state,
        tenantId: event.payload.tenantId,
        currentStep: "POLICY_BASELINE",
      };
    }
    case "APPLY_POLICY_BASELINE": {
      if (state.currentStep !== "POLICY_BASELINE" || !state.tenantId) {
        return state;
      }

      return {
        ...state,
        policyBaseline: event.payload.policyBaseline,
        currentStep: "FIRST_GOVERNED_ACTION",
      };
    }
    case "COMPLETE_FIRST_GOVERNED_ACTION": {
      if (state.currentStep !== "FIRST_GOVERNED_ACTION" || !state.policyBaseline) {
        return state;
      }

      return {
        ...state,
        currentStep: "COMPLETE",
      };
    }
    case "FINISH_ONBOARDING": {
      if (state.currentStep !== "COMPLETE") {
        return state;
      }

      return {
        ...state,
        completed: true,
        currentStep: "COMPLETE",
      };
    }
    case "RESET": {
      return defaultOnboardingState;
    }
    default: {
      return state;
    }
  }
}
