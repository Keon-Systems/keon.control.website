"use client";

import { getEntryRoute } from "@/lib/onboarding/experience";
import { useOnboardingState } from "@/lib/onboarding/store";
import type { OnboardingState } from "@/lib/onboarding/state-machine";
import * as React from "react";

const PROVISIONING_COMPLETE_KEY = "keon.activation.provisioning-complete";

export type FirstRunStage = "activate" | "welcome" | "setup" | "app";

export interface FirstRunStatus {
  provisioningComplete: boolean;
  onboardingComplete: boolean;
  readyState: boolean;
  nextRoute: string;
  stage: FirstRunStage;
}

export function canAccessFirstRunStage(
  expectedStage: FirstRunStage,
  status: Pick<FirstRunStatus, "provisioningComplete" | "stage">
) {
  if (expectedStage === "setup") {
    // WELCOME-stage users belong at /welcome, not /setup.
    // Completed (app-stage) users may revisit setup.
    return status.provisioningComplete && status.stage !== "welcome";
  }
  return status.stage === expectedStage;
}

interface FirstRunContextValue extends FirstRunStatus {
  hydrated: boolean;
  markProvisioningComplete: () => void;
  resetProvisioningComplete: () => void;
}

export function deriveFirstRunStatus(input: {
  provisioningComplete: boolean;
  onboardingState: OnboardingState;
}): FirstRunStatus {
  const onboardingComplete = input.onboardingState.completed;
  const readyState = input.provisioningComplete && onboardingComplete;

  if (!input.provisioningComplete) {
    return {
      provisioningComplete: false,
      onboardingComplete,
      readyState: false,
      nextRoute: "/activate",
      stage: "activate",
    };
  }

  if (!onboardingComplete) {
    const nextRoute = getEntryRoute(input.onboardingState);
    return {
      provisioningComplete: true,
      onboardingComplete: false,
      readyState: false,
      nextRoute,
      stage: input.onboardingState.currentStep === "WELCOME" ? "welcome" : "setup",
    };
  }

  return {
    provisioningComplete: true,
    onboardingComplete: true,
    readyState: true,
    nextRoute: "/control",
    stage: "app",
  };
}

const FirstRunContext = React.createContext<FirstRunContextValue>({
  hydrated: false,
  provisioningComplete: false,
  onboardingComplete: false,
  readyState: false,
  nextRoute: "/activate",
  stage: "activate",
  markProvisioningComplete: () => undefined,
  resetProvisioningComplete: () => undefined,
});

export function FirstRunStateProvider({ children }: { children: React.ReactNode }) {
  const { hydrated: onboardingHydrated, state: onboardingState } = useOnboardingState();
  const [provisioningHydrated, setProvisioningHydrated] = React.useState(false);
  const [provisioningComplete, setProvisioningComplete] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setProvisioningComplete(window.localStorage.getItem(PROVISIONING_COMPLETE_KEY) === "true");
    setProvisioningHydrated(true);
  }, []);

  const markProvisioningComplete = React.useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PROVISIONING_COMPLETE_KEY, "true");
    }
    setProvisioningComplete(true);
  }, []);

  const resetProvisioningComplete = React.useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(PROVISIONING_COMPLETE_KEY);
    }
    setProvisioningComplete(false);
  }, []);

  const status = React.useMemo(
    () =>
      deriveFirstRunStatus({
        provisioningComplete,
        onboardingState,
      }),
    [onboardingState, provisioningComplete]
  );

  const value = React.useMemo<FirstRunContextValue>(
    () => ({
      hydrated: onboardingHydrated && provisioningHydrated,
      ...status,
      markProvisioningComplete,
      resetProvisioningComplete,
    }),
    [markProvisioningComplete, onboardingHydrated, provisioningHydrated, resetProvisioningComplete, status]
  );

  return <FirstRunContext.Provider value={value}>{children}</FirstRunContext.Provider>;
}

export function useFirstRunState() {
  return React.useContext(FirstRunContext);
}

export function getFirstRunStageForRoute(pathname: string): FirstRunStage {
  if (pathname.startsWith("/activate")) {
    return "activate";
  }

  if (pathname.startsWith("/welcome")) {
    return "welcome";
  }

  if (pathname.startsWith("/setup") || pathname.startsWith("/onboarding")) {
    return "setup";
  }

  return "app";
}
