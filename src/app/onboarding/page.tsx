"use client";

import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { OnboardingGate } from "@/components/onboarding/route-gates";

export default function OnboardingPage() {
  return (
    <OnboardingGate>
      <OnboardingFlow />
    </OnboardingGate>
  );
}
