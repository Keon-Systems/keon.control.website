"use client";

import * as React from "react";
import {
  defaultOnboardingState,
  type OnboardingEvent,
  type OnboardingGoal,
  type OnboardingState,
  type GuardrailPreset,
  sanitizeOnboardingState,
  transitionOnboardingState,
} from "./state-machine";

const STORAGE_KEY = "keon.onboarding.state";

interface OnboardingStoreValue {
  hydrated: boolean;
  state: OnboardingState;
  dispatch: (event: OnboardingEvent) => void;
  startSetup: () => void;
  saveGoals: (selectedGoals: OnboardingGoal[]) => void;
  confirmAccess: (workspaceId: string) => void;
  applyGuardrails: (guardrailPreset: GuardrailPreset) => void;
  finishOnboarding: () => void;
  resetOnboarding: () => void;
}

const OnboardingStoreContext = React.createContext<OnboardingStoreValue>({
  hydrated: false,
  state: defaultOnboardingState,
  dispatch: () => undefined,
  startSetup: () => undefined,
  saveGoals: () => undefined,
  confirmAccess: () => undefined,
  applyGuardrails: () => undefined,
  finishOnboarding: () => undefined,
  resetOnboarding: () => undefined,
});

export function OnboardingStateProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = React.useState(false);
  const [state, dispatch] = React.useReducer(transitionOnboardingState, defaultOnboardingState);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setHydrated(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<OnboardingState>;
      dispatch({ type: "HYDRATE", payload: sanitizeOnboardingState(parsed) });
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined" || !hydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  const value = React.useMemo<OnboardingStoreValue>(
    () => ({
      hydrated,
      state,
      dispatch,
      startSetup: () => dispatch({ type: "START_SETUP" }),
      saveGoals: (selectedGoals) => dispatch({ type: "SAVE_GOALS", payload: { selectedGoals } }),
      confirmAccess: (workspaceId) => dispatch({ type: "CONFIRM_ACCESS", payload: { workspaceId } }),
      applyGuardrails: (guardrailPreset) => dispatch({ type: "APPLY_GUARDRAILS", payload: { guardrailPreset } }),
      finishOnboarding: () => dispatch({ type: "FINISH_ONBOARDING" }),
      resetOnboarding: () => dispatch({ type: "RESET" }),
    }),
    [hydrated, state]
  );

  return <OnboardingStoreContext.Provider value={value}>{children}</OnboardingStoreContext.Provider>;
}

export function useOnboardingState() {
  return React.useContext(OnboardingStoreContext);
}
