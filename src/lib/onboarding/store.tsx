"use client";

import * as React from "react";
import {
  defaultOnboardingState,
  type OnboardingIntent,
  type OnboardingState,
  type PolicyBaseline,
  sanitizeOnboardingState,
  transitionOnboardingState,
} from "./state-machine";

const STORAGE_KEY = "keon.onboarding.state";

interface OnboardingStoreValue {
  hydrated: boolean;
  state: OnboardingState;
  beginSetup: () => void;
  saveIntentSelection: (selectedIntent: OnboardingIntent[]) => void;
  confirmScope: (tenantId: string) => void;
  applyPolicyBaseline: (policyBaseline: PolicyBaseline) => void;
  completeFirstGovernedAction: () => void;
  finishOnboarding: () => void;
  resetOnboarding: () => void;
}

const OnboardingStoreContext = React.createContext<OnboardingStoreValue>({
  hydrated: false,
  state: defaultOnboardingState,
  beginSetup: () => undefined,
  saveIntentSelection: () => undefined,
  confirmScope: () => undefined,
  applyPolicyBaseline: () => undefined,
  completeFirstGovernedAction: () => undefined,
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
      beginSetup: () => dispatch({ type: "BEGIN_SETUP" }),
      saveIntentSelection: (selectedIntent) => dispatch({ type: "SAVE_INTENT_SELECTION", payload: { selectedIntent } }),
      confirmScope: (tenantId) => dispatch({ type: "CONFIRM_SCOPE", payload: { tenantId } }),
      applyPolicyBaseline: (policyBaseline) =>
        dispatch({ type: "APPLY_POLICY_BASELINE", payload: { policyBaseline } }),
      completeFirstGovernedAction: () => dispatch({ type: "COMPLETE_FIRST_GOVERNED_ACTION" }),
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
