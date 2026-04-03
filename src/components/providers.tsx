"use client";

import { getApiConfig } from "@/lib/api";
import { OnboardingPreferencesProvider } from "@/lib/control-plane/onboarding-preferences";
import { TenantContextProvider } from "@/lib/control-plane/tenant-context";
import { TenantBindingProvider } from "@/lib/control-plane/tenant-binding";
import { IncidentModeProvider } from "@/lib/incident-mode";
import { OnboardingStateProvider } from "@/lib/onboarding/store";
import { QueryProvider } from "@/lib/query/QueryProvider";
import { AppStateProvider } from "@/lib/state";
import * as React from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const apiConfig = getApiConfig();

  return (
    <QueryProvider>
      <AppStateProvider initialState={{ liveMode: apiConfig.liveMode }}>
        <TenantContextProvider>
          <TenantBindingProvider>
            <OnboardingPreferencesProvider>
              <OnboardingStateProvider>
                <IncidentModeProvider>{children}</IncidentModeProvider>
              </OnboardingStateProvider>
            </OnboardingPreferencesProvider>
          </TenantBindingProvider>
        </TenantContextProvider>
      </AppStateProvider>
    </QueryProvider>
  );
}
