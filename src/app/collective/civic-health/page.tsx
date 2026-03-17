import { CivicHealthPanel } from "@/components/collective/civic-health-panel";
import { OversightSignalPanel } from "@/components/collective/oversight-signal-panel";
import { PageHeader } from "@/ui-kit/components/PageHeader";
import {
  mockCivicHealthSnapshot,
  mockOversightSignals,
} from "@/lib/server/collectiveMockProjections";
import {
  toUICivicHealthSnapshot,
  toUIOversightSignal,
} from "@/lib/mappers/collective";

export default function CivicHealthPage() {
  const snapshot = toUICivicHealthSnapshot(mockCivicHealthSnapshot());
  const signals = mockOversightSignals().map(toUIOversightSignal);

  return (
    <div className="flex flex-col h-full bg-[#0B0C10]">
      <PageHeader
        title="Civic Health"
        description="Civic health snapshot and oversight signals — read-only observer view"
      />

      {/* DEMO banner */}
      <div className="mx-6 mt-4 rounded border border-[--safety-orange]/40 bg-[--safety-orange]/10 px-4 py-3 font-mono text-xs text-[--safety-orange]">
        <span className="font-bold uppercase tracking-wider">
          Projection-Only
        </span>
        {" — "}
        This view displays demo data. No merged backend contract exists for
        civic health.
      </div>

      <div className="flex-1 space-y-6 p-6">
        <CivicHealthPanel snapshot={snapshot} />
        <OversightSignalPanel signals={signals} />
      </div>
    </div>
  );
}
