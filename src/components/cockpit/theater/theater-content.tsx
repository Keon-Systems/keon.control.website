"use client";

/**
 * Theater Content — Mode-based content router.
 *
 * Mounts the correct mode component based on centerMode.
 * No routing. No page transitions. Just component swap.
 *
 * All 9 modes wired.
 */

import { useCenterMode } from "@/lib/cockpit/use-focus";
import { AlertsMode } from "./alerts-mode";
import { DecisionsMode } from "./decisions-mode";
import { EvidenceMode } from "./evidence-mode";
import { ExecutionsMode } from "./executions-mode";
import { FleetMode } from "./fleet-mode";
import { IncidentsMode } from "./incidents-mode";
import { PoliciesMode } from "./policies-mode";
import { ReceiptsMode } from "./receipts-mode";
import { TracesMode } from "./traces-mode";

export function TheaterContent() {
  const { centerMode } = useCenterMode();

  switch (centerMode) {
    case "fleet":
      return <FleetMode />;
    case "executions":
      return <ExecutionsMode />;
    case "traces":
      return <TracesMode />;
    case "governance-receipts":
      return <ReceiptsMode />;
    case "governance-decisions":
      return <DecisionsMode />;
    case "evidence":
      return <EvidenceMode />;
    case "policies":
      return <PoliciesMode />;
    case "alerts":
      return <AlertsMode />;
    case "incidents":
      return <IncidentsMode />;
    default:
      return null;
  }
}

