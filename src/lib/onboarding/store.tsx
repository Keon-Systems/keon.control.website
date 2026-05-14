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

function persistOnboardingState(state: OnboardingState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

interface OnboardingStoreValue {
  hydrated: boolean;
  state: OnboardingState;
  dispatch: (event: OnboardingEvent) => void;
  startSetup: () => void;
  saveGoals: (selectedGoals: OnboardingGoal[]) => void;
  confirmAccess: (workspaceId: string) => void;
  advanceLifecyclePreview: () => void;
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
  advanceLifecyclePreview: () => undefined,
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

    persistOnboardingState(state);
  }, [hydrated, state]);

  const value = React.useMemo<OnboardingStoreValue>(
    () => {
      const dispatchAndPersist = (event: OnboardingEvent) => {
        const nextState = transitionOnboardingState(state, event);
        persistOnboardingState(nextState);
        dispatch(event);
      };

      return {
        hydrated,
        state,
        dispatch,
        startSetup: () => dispatchAndPersist({ type: "START_SETUP" }),
        saveGoals: (selectedGoals) => dispatchAndPersist({ type: "SAVE_GOALS", payload: { selectedGoals } }),
        confirmAccess: (workspaceId) => dispatchAndPersist({ type: "CONFIRM_ACCESS", payload: { workspaceId } }),
        advanceLifecyclePreview: () => dispatchAndPersist({ type: "ADVANCE_LIFECYCLE_PREVIEW" }),
        applyGuardrails: (guardrailPreset) => dispatchAndPersist({ type: "APPLY_GUARDRAILS", payload: { guardrailPreset } }),
        finishOnboarding: () => dispatchAndPersist({ type: "FINISH_ONBOARDING" }),
        resetOnboarding: () => dispatchAndPersist({ type: "RESET" }),
      };
    },
    [hydrated, state]
  );

  return <OnboardingStoreContext.Provider value={value}>{children}</OnboardingStoreContext.Provider>;
}

export function useOnboardingState() {
  return React.useContext(OnboardingStoreContext);
}
