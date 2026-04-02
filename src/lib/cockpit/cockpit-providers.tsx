"use client";

/**
 * Keon Control — Cockpit Provider Composition
 *
 * Composes all cockpit state providers in correct nesting order.
 * This wraps INSIDE the existing global providers (QueryProvider,
 * AppStateProvider, TenantContextProvider, IncidentModeProvider).
 *
 * Nesting order:
 *   1. GovernanceStateProvider (session-level, reads from TenantContext)
 *   2. FocusStateProvider (interaction-level, reads from governance)
 *   3. ActionStateProvider (action-level, reads from focus + governance)
 *   4. children
 *
 * References:
 *   - Section 5: PR-0.5 — Provider Composition
 */

import * as React from "react";
import { GovernanceStateProvider } from "./governance-context";
import { FocusStateProvider } from "./focus-context";
import { ActionStateProvider } from "./action-context";

interface CockpitProvidersProps {
  children: React.ReactNode;
}

/**
 * Wrap cockpit content with all cockpit-specific state providers.
 *
 * Usage (in layout or shell):
 * ```tsx
 * <Providers>           {/* existing global providers *\/}
 *   <CockpitProviders>  {/* cockpit state layer *\/}
 *     <CockpitShell />
 *   </CockpitProviders>
 * </Providers>
 * ```
 */
export function CockpitProviders({ children }: CockpitProvidersProps) {
  return (
    <GovernanceStateProvider>
      <FocusStateProvider>
        <ActionStateProvider>
          {children}
        </ActionStateProvider>
      </FocusStateProvider>
    </GovernanceStateProvider>
  );
}

