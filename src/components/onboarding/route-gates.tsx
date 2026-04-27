"use client";

import { canAccessFirstRunStage, getFirstRunStageForRoute, useFirstRunState, type FirstRunStage } from "@/lib/first-run/state";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

function RedirectingMessage({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0C10] px-6 text-center">
      <div className="space-y-3">
        <div className="font-display text-3xl font-semibold text-[#F3F5F7]">Keon Control</div>
        <p className="font-mono text-sm leading-6 text-[#C5C6C7]">{message}</p>
      </div>
    </div>
  );
}

function useStageRedirect(expectedStage: FirstRunStage) {
  const router = useRouter();
  const pathname = usePathname();
  const firstRun = useFirstRunState();
  const routeStage = getFirstRunStageForRoute(pathname);
  const isOnExpectedStage = routeStage === expectedStage && canAccessFirstRunStage(expectedStage, firstRun);

  React.useEffect(() => {
    if (!firstRun.hydrated || isOnExpectedStage) {
      return;
    }

    router.replace(firstRun.nextRoute);
  }, [firstRun.hydrated, firstRun.nextRoute, isOnExpectedStage, router]);

  return { firstRun, isOnExpectedStage };
}

export function EntryRedirect() {
  const router = useRouter();
  const firstRun = useFirstRunState();

  React.useEffect(() => {
    if (!firstRun.hydrated) {
      return;
    }

    router.replace(firstRun.nextRoute);
  }, [firstRun.hydrated, firstRun.nextRoute, router]);

  return <RedirectingMessage message="Checking your workspace setup." />;
}

export function ActivationGate({ children }: { children: React.ReactNode }) {
  const { firstRun, isOnExpectedStage } = useStageRedirect("activate");

  if (!firstRun.hydrated) {
    return <RedirectingMessage message="Preparing activation." />;
  }

  if (!isOnExpectedStage) {
    return <RedirectingMessage message="Opening the next step in setup." />;
  }

  return <>{children}</>;
}

export function WelcomeGate({ children }: { children: React.ReactNode }) {
  const { firstRun, isOnExpectedStage } = useStageRedirect("welcome");

  if (!firstRun.hydrated) {
    return <RedirectingMessage message="Preparing your guided setup." />;
  }

  if (!isOnExpectedStage) {
    return <RedirectingMessage message="Opening the next required step." />;
  }

  return <>{children}</>;
}

export function SetupGate({ children }: { children: React.ReactNode }) {
  const { firstRun, isOnExpectedStage } = useStageRedirect("setup");

  if (!firstRun.hydrated) {
    return <RedirectingMessage message="Preparing your setup checklist." />;
  }

  if (!isOnExpectedStage) {
    return <RedirectingMessage message="Opening the next required step." />;
  }

  return <>{children}</>;
}

export function AppReadyGate({ children }: { children: React.ReactNode }) {
  const { firstRun, isOnExpectedStage } = useStageRedirect("app");

  if (!firstRun.hydrated) {
    return <RedirectingMessage message="Loading your workspace." />;
  }

  if (!isOnExpectedStage) {
    return <RedirectingMessage message="Finishing setup before opening the workspace." />;
  }

  return <>{children}</>;
}
