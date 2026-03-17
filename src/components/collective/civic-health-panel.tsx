import { Badge } from "@/components/ui/badge";
import { HeatStateBadge } from "@/components/collective/heat-state-badge";
import type { UICivicHealthSnapshot } from "@/lib/mappers/collective";

interface CivicHealthPanelProps {
  readonly snapshot: UICivicHealthSnapshot;
}

export function CivicHealthPanel({ snapshot }: CivicHealthPanelProps) {
  return (
    <div className="rounded border border-[#384656] bg-[#1F2833] p-4 font-mono">
      <div className="mb-3 text-xs uppercase tracking-wider text-[--steel]">
        Civic Health Snapshot
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {/* Heat State */}
        <div className="rounded border border-[#384656] bg-[#0B0C10] p-3">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-[--steel]">
            Heat State
          </div>
          <HeatStateBadge state={snapshot.heatState} variant={snapshot.heatBadgeVariant} />
        </div>

        {/* Oversight Mode */}
        <div className="rounded border border-[#384656] bg-[#0B0C10] p-3">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-[--steel]">
            Oversight Mode
          </div>
          <div className="text-sm text-[--flash]">{snapshot.oversightMode}</div>
        </div>

        {/* Active Deliberations */}
        <div className="rounded border border-[#384656] bg-[#0B0C10] p-3">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-[--steel]">
            Active Deliberations
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg tabular-nums text-[--flash]">
              {snapshot.activeDeliberations}
            </span>
            <Badge variant={snapshot.activeDeliberations > 0 ? "healthy" : "neutral"}>
              {snapshot.activeDeliberations > 0 ? "ACTIVE" : "NONE"}
            </Badge>
          </div>
        </div>

        {/* Pending Reforms */}
        <div className="rounded border border-[#384656] bg-[#0B0C10] p-3">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-[--steel]">
            Pending Reforms
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg tabular-nums text-[--flash]">
              {snapshot.pendingReforms}
            </span>
            <Badge variant={snapshot.pendingReforms > 0 ? "warning" : "neutral"}>
              {snapshot.pendingReforms > 0 ? "PENDING" : "NONE"}
            </Badge>
          </div>
        </div>

        {/* Last Heartbeat */}
        <div className="rounded border border-[#384656] bg-[#0B0C10] p-3">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-[--steel]">
            Last Heartbeat
          </div>
          <div className="text-sm text-[--flash]">{snapshot.heartbeatAgeLabel}</div>
        </div>

        {/* Epoch */}
        <div className="rounded border border-[#384656] bg-[#0B0C10] p-3">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-[--steel]">
            Epoch
          </div>
          <div className="text-sm text-[--flash]">{snapshot.epoch}</div>
        </div>
      </div>
    </div>
  );
}
