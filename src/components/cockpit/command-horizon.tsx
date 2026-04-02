"use client";

/**
 * Command Horizon — Zone 1
 *
 * Full-width top band. h-12. Fixed. No scroll. No overflow.
 * Instant operational orientation in under 2 seconds.
 *
 * Modules (left to right):
 *   IdentityAnchor | SystemPosture | ActiveSystems | GovernancePostureBadge |
 *   AnomalyCounter | CausalPulse (flex) | TimeSync | CommandTrigger
 */

import {
    ActiveSystems,
    AnomalyCounter,
    CausalPulse,
    CommandTrigger,
    GovernancePostureBadge,
    IdentityAnchor,
    SystemPosture,
    TimeSync,
    useCommandHorizonData,
} from "./horizon";

interface CommandHorizonProps {
  onCommandPaletteOpen?: () => void;
}

export function CommandHorizon({ onCommandPaletteOpen }: CommandHorizonProps) {
  const data = useCommandHorizonData();

  return (
    <div className="flex h-12 w-full shrink-0 items-center border-b border-[#1F2833]/80 bg-[#0B0C10] px-4 z-30">
      {/* Left cluster: Identity + Posture + Systems + Governance */}
      <IdentityAnchor />
      <SystemPosture posture={data.systemPosture} />
      <ActiveSystems subsystems={data.subsystems} />
      <GovernancePostureBadge />
      <AnomalyCounter counters={data.counters} />

      {/* Center: Causal Pulse (takes remaining space) */}
      <CausalPulse event={data.causalPulse} />

      {/* Right cluster: Time + Command */}
      <TimeSync ledgerFreshness={data.ledgerFreshness} freshness={data.freshness} />
      <CommandTrigger onOpen={onCommandPaletteOpen ?? (() => {})} />
    </div>
  );
}

