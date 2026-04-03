"use client";

import { useOnboardingState } from "@/lib/onboarding/store";
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

export function EntryRedirect() {
  const router = useRouter();
  const { hydrated, state } = useOnboardingState();

  React.useEffect(() => {
    if (!hydrated) {
      return;
    }

    router.replace(state.completed ? "/control" : "/onboarding");
  }, [hydrated, router, state.completed]);

  return <RedirectingMessage message="Checking your workspace setup." />;
}

export function ControlGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { hydrated, state } = useOnboardingState();

  React.useEffect(() => {
    if (!hydrated || state.completed) {
      return;
    }

    router.replace(`/onboarding?from=${encodeURIComponent(pathname)}`);
  }, [hydrated, pathname, router, state.completed]);

  if (!hydrated) {
    return <RedirectingMessage message="Loading your governed workspace." />;
  }

  if (!state.completed) {
    return <RedirectingMessage message="Finishing setup before opening the control plane." />;
  }

  return <>{children}</>;
}

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { hydrated, state } = useOnboardingState();

  React.useEffect(() => {
    if (!hydrated || !state.completed) {
      return;
    }

    router.replace("/control");
  }, [hydrated, router, state.completed]);

  if (!hydrated) {
    return <RedirectingMessage message="Preparing your guided setup." />;
  }

  if (state.completed) {
    return <RedirectingMessage message="Opening your control plane." />;
  }

  return <>{children}</>;
}
