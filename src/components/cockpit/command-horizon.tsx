"use client";

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
    <div className="z-30 flex h-12 w-full shrink-0 items-center border-b border-[#1F2833]/80 bg-[#0B0C10] px-4">
      <IdentityAnchor />
      <SystemPosture posture={data.systemPosture} />
      <ActiveSystems subsystems={data.subsystems} />
      <GovernancePostureBadge />
      <AnomalyCounter counters={data.counters} />
      <CausalPulse event={data.causalPulse} />
      <TimeSync ledgerFreshness={data.ledgerFreshness} freshness={data.freshness} />
      <CommandTrigger onOpen={onCommandPaletteOpen ?? (() => {})} />
    </div>
  );
}
