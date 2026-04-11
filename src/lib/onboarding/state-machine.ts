export const onboardingSteps = [
  "WELCOME",
  "DEFINE_GOALS",
  "CONFIRM_ACCESS",
  "SELECT_INTEGRATION",
  "SET_GUARDRAILS",
  "READY",
] as const;

export type OnboardingStep = (typeof onboardingSteps)[number];

export const onboardingGoalOptions = [
  "govern-ai-actions",
  "memory-and-context",
  "oversight-and-collaboration",
] as const;

export type OnboardingGoal = (typeof onboardingGoalOptions)[number];

export const guardrailPresetOptions = ["strict", "balanced", "flexible"] as const;

export type GuardrailPreset = (typeof guardrailPresetOptions)[number];

export type IntegrationMode = "BYO_AI" | "COLLECTIVE";

export interface OnboardingState {
  currentStep: OnboardingStep;
  selectedGoals: OnboardingGoal[];
  workspaceId: string | null;
  integrationStepCompleted: boolean;
  selectedIntegrationMode: IntegrationMode | undefined;
  guardrailPreset: GuardrailPreset | null;
  completed: boolean;
}

export type OnboardingEvent =
  | { type: "HYDRATE"; payload: Partial<OnboardingState> }
  | { type: "START_SETUP" }
  | { type: "SAVE_GOALS"; payload: { selectedGoals: OnboardingGoal[] } }
  | { type: "CONFIRM_ACCESS"; payload: { workspaceId: string } }
  | { type: "ADVANCE_INTEGRATION"; payload?: { selectedMode?: IntegrationMode } }
  | { type: "APPLY_GUARDRAILS"; payload: { guardrailPreset: GuardrailPreset } }
  | { type: "FINISH_ONBOARDING" }
  | { type: "RESET" };

export const defaultOnboardingState: OnboardingState = {
  currentStep: "WELCOME",
  selectedGoals: [],
  workspaceId: null,
  integrationStepCompleted: false,
  selectedIntegrationMode: undefined,
  guardrailPreset: null,
  completed: false,
};

export function isOnboardingStep(value: unknown): value is OnboardingStep {
  return typeof value === "string" && onboardingSteps.includes(value as OnboardingStep);
}

export function isOnboardingGoal(value: unknown): value is OnboardingGoal {
  return typeof value === "string" && onboardingGoalOptions.includes(value as OnboardingGoal);
}

export function isGuardrailPreset(value: unknown): value is GuardrailPreset {
  return typeof value === "string" && guardrailPresetOptions.includes(value as GuardrailPreset);
}

export function isIntegrationMode(value: unknown): value is IntegrationMode {
  return value === "BYO_AI" || value === "COLLECTIVE";
}

export function sanitizeOnboardingState(input: Partial<OnboardingState> | null | undefined): OnboardingState {
  const selectedGoals = Array.isArray(input?.selectedGoals) ? input.selectedGoals.filter(isOnboardingGoal) : [];
  const workspaceId = typeof input?.workspaceId === "string" && input.workspaceId.length > 0 ? input.workspaceId : null;
  const integrationStepCompleted = input?.integrationStepCompleted === true;
  const selectedIntegrationMode = isIntegrationMode(input?.selectedIntegrationMode)
    ? input.selectedIntegrationMode
    : undefined;
  const guardrailPreset = isGuardrailPreset(input?.guardrailPreset) ? input.guardrailPreset : null;
  const completed = input?.completed === true;
  const currentStep = completed
    ? "READY"
    : isOnboardingStep(input?.currentStep)
      ? input.currentStep
      : defaultOnboardingState.currentStep;

  return {
    currentStep,
    selectedGoals,
    workspaceId,
    integrationStepCompleted,
    selectedIntegrationMode,
    guardrailPreset,
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
    case "START_SETUP": {
      if (state.currentStep !== "WELCOME" || state.completed) {
        return state;
      }
      return { ...state, currentStep: "DEFINE_GOALS" };
    }
    case "SAVE_GOALS": {
      if (state.currentStep === "WELCOME" || event.payload.selectedGoals.length === 0) {
        return state;
      }
      return {
        ...state,
        selectedGoals: event.payload.selectedGoals,
        currentStep: "CONFIRM_ACCESS",
      };
    }
    case "CONFIRM_ACCESS": {
      if (state.selectedGoals.length === 0) {
        return state;
      }
      return {
        ...state,
        workspaceId: event.payload.workspaceId,
        currentStep: "SELECT_INTEGRATION",
      };
    }
    case "ADVANCE_INTEGRATION": {
      if (!state.workspaceId || state.currentStep !== "SELECT_INTEGRATION") {
        return state;
      }
      return {
        ...state,
        integrationStepCompleted: true,
        selectedIntegrationMode: event.payload?.selectedMode ?? state.selectedIntegrationMode,
        currentStep: "SET_GUARDRAILS",
      };
    }
    case "APPLY_GUARDRAILS": {
      if (!state.workspaceId) {
        return state;
      }
      return {
        ...state,
        guardrailPreset: event.payload.guardrailPreset,
        currentStep: "READY",
      };
    }
    case "FINISH_ONBOARDING": {
      if (state.currentStep !== "READY" || !state.guardrailPreset) {
        return state;
      }
      return { ...state, completed: true, currentStep: "READY" };
    }
    case "RESET": {
      return defaultOnboardingState;
    }
    default: {
      return state;
    }
  }
}
