"use client";

import { ActiveIncidentsPanel, AtRiskCollections, CriticalAlertsFeed, SloBurnBanner } from "@/components/fleet";
import { Shell } from "@/components/layout";

/**
 * Fleet Command Surface
 * Operator-facing mission control: active incidents, SLO burn, at-risk revenue, critical alerts.
 * All panels are wired to TanStack Query and auto-refresh.
 */
export default function FleetPage() {
  return (
    <Shell>
      <div className="space-y-4 p-4">
        {/* SLO Burn Banner — spans full width, prominent if any SLO is burning */}
        <SloBurnBanner />

        {/* Main Fleet Grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Active Incidents — widest column, most critical */}
          <div className="lg:col-span-5">
            <ActiveIncidentsPanel />
          </div>

          {/* At-Risk Collections — revenue risk */}
          <div className="lg:col-span-4">
            <AtRiskCollections />
          </div>

          {/* Critical Alerts Feed — right column */}
          <div className="lg:col-span-3">
            <CriticalAlertsFeed />
          </div>
        </div>
      </div>
    </Shell>
  );
}
