"use client";

/**
 * Cockpit Mode - Phase 1
 *
 * Dedicated route for the constitutional cockpit.
 * Access at /cockpit to test the shell alongside the existing app.
 *
 * This route will be removed in Phase 7 when the cockpit becomes
 * the default shell and absorbs all operational routes.
 */

import { CockpitProviders } from "@/lib/cockpit/cockpit-providers";
import { CockpitShell } from "@/components/cockpit/cockpit-shell";

export default function CockpitPage() {
  return (
    <CockpitProviders>
      <CockpitShell />
    </CockpitProviders>
  );
}
