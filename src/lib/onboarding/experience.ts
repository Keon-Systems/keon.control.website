import type { OnboardingState, OnboardingStep } from "./state-machine";

export type SetupRouteKey = "welcome" | "goals" | "access" | "integration" | "guardrails" | "ready";
export type ChecklistStatus = "complete" | "current" | "upcoming";

export interface SetupChecklistItem {
  id: SetupRouteKey;
  title: string;
  description: string;
  href: string;
  required: boolean;
  status: ChecklistStatus;
}

const REQUIRED_ITEMS: Omit<SetupChecklistItem, "status">[] = [
  {
    id: "goals",
    title: "Define your goal",
    description: "Tell Keon what you want to protect and enable first.",
    href: "/setup?step=goals",
    required: true,
  },
  {
    id: "access",
    title: "Confirm workspace access",
    description: "Choose the workspace and environment Keon should prepare.",
    href: "/setup?step=access",
    required: true,
  },
  {
    id: "guardrails",
    title: "Set starter guardrails",
    description: "Choose the starting review and approval posture for AI-driven actions.",
    href: "/setup?step=guardrails",
    required: true,
  },
];

const OPTIONAL_ITEMS: Omit<SetupChecklistItem, "status">[] = [
  {
    id: "ready",
    title: "Review sample receipts",
    description: "See the evidence trail Keon records for reviewed actions.",
    href: "/receipts",
    required: false,
  },
  {
    id: "ready",
    title: "Set up collaborative review",
    description: "Bring other reviewers into sensitive decisions later.",
    href: "/collective",
    required: false,
  },
];

export const stepRouteMap: Record<OnboardingStep, SetupRouteKey> = {
  WELCOME: "welcome",
  DEFINE_GOALS: "goals",
  CONFIRM_ACCESS: "access",
  SELECT_INTEGRATION: "integration",
  SET_GUARDRAILS: "guardrails",
  READY: "ready",
};

export const routeStepMap: Record<SetupRouteKey, OnboardingStep> = {
  welcome: "WELCOME",
  goals: "DEFINE_GOALS",
  access: "CONFIRM_ACCESS",
  integration: "SELECT_INTEGRATION",
  guardrails: "SET_GUARDRAILS",
  ready: "READY",
};

export const stepLabels: Record<OnboardingStep, string> = {
  WELCOME: "Welcome",
  DEFINE_GOALS: "Define your goal",
  CONFIRM_ACCESS: "Confirm workspace access",
  SELECT_INTEGRATION: "Choose operating model",
  SET_GUARDRAILS: "Set starter guardrails",
  READY: "Ready to use",
};

export function getNextRequiredStep(state: OnboardingState): OnboardingStep {
  if (state.selectedGoals.length === 0) {
    return "DEFINE_GOALS";
  }

  if (!state.workspaceId) {
    return "CONFIRM_ACCESS";
  }

  if (!state.integrationStepCompleted) {
    return "SELECT_INTEGRATION";
  }

  if (!state.guardrailPreset) {
    return "SET_GUARDRAILS";
  }

  return "READY";
}

export function getRequiredCompletionCount(state: OnboardingState) {
  return [state.selectedGoals.length > 0, !!state.workspaceId, !!state.guardrailPreset].filter(Boolean).length;
}

export function getReadinessLabel(state: OnboardingState) {
  if (state.completed) {
    return "Ready to use";
  }

  const completed = getRequiredCompletionCount(state);
  return `${completed}/3 required steps complete`;
}

export function getCurrentBlocker(state: OnboardingState) {
  switch (getNextRequiredStep(state)) {
    case "DEFINE_GOALS":
      return "Choose what you want Keon to manage first.";
    case "CONFIRM_ACCESS":
      return "Confirm the workspace and environment you want to prepare.";
    case "SELECT_INTEGRATION":
      return "Review how Keon governs decisions before continuing.";
    case "SET_GUARDRAILS":
      return "Choose the starter guardrails Keon should apply.";
    case "READY":
      return state.completed ? "Your workspace is ready." : "Review your ready state and enter the workspace overview.";
    default:
      return "Start setup.";
  }
}

/**
 * Canonical first-run routing.
 *
 * Priority order:
 *   1. fully ready (onboarding complete)     → /control
 *   2. provisioning not yet complete         → /activate  (magic-link gate)
 *   3. provisioning done, at welcome step    → /welcome
 *   4. provisioning done, mid-setup          → /setup?step=...
 *
 * The `activationCompleted` flag is written to localStorage by ActivationFlow
 * when provisioning_complete is reached. Defaults to true when not provided
 * so that existing call sites (e.g. tests) are unaffected.
 *
 * Note: routing to /activate without a ?token will correctly display the
 * token_missing error state — there is no silent dead-end.
 */
export function getEntryRoute(
  state: OnboardingState,
  options?: { activationCompleted?: boolean }
) {
  if (state.completed) {
    return "/control";
  }

  // If activation has explicitly not completed, gate here before onboarding.
  // Default true for backwards compatibility with call sites that don't pass options.
  if (options?.activationCompleted === false) {
    return "/activate";
  }

  return state.currentStep === "WELCOME" ? "/welcome" : `/setup?step=${stepRouteMap[getNextRequiredStep(state)]}`;
}

export function getChecklistItems(state: OnboardingState) {
  const nextStep = getNextRequiredStep(state);

  const required = REQUIRED_ITEMS.map((item) => {
    const step = routeStepMap[item.id];
    const isComplete =
      (step === "DEFINE_GOALS" && state.selectedGoals.length > 0) ||
      (step === "CONFIRM_ACCESS" && !!state.workspaceId) ||
      (step === "SET_GUARDRAILS" && !!state.guardrailPreset);

    const status: ChecklistStatus = isComplete ? "complete" : step === nextStep ? "current" : "upcoming";

    return {
      ...item,
      status,
    };
  });

  const optional = OPTIONAL_ITEMS.map((item) => ({
    ...item,
    status: state.completed ? "current" : "upcoming",
  }));

  return { required, optional };
}

export function clampVisibleStep(value: string | null | undefined, state: OnboardingState): OnboardingStep {
  if (!value) {
    return getNextRequiredStep(state);
  }

  const normalized = value.toLowerCase() as SetupRouteKey;
  if (!(normalized in routeStepMap)) {
    return getNextRequiredStep(state);
  }

  const requestedStep = routeStepMap[normalized];
  const requestedOrder = Object.values(routeStepMap).indexOf(requestedStep);
  const allowedOrder = Object.values(routeStepMap).indexOf(getNextRequiredStep(state));

  return requestedOrder > allowedOrder ? getNextRequiredStep(state) : requestedStep;
}
