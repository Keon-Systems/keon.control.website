import { OversightSignalPanel } from "@/components/collective/oversight-signal-panel";
import { PageHeader } from "@/ui-kit/components/PageHeader";
import { mockOversightSignals } from "@/lib/server/collectiveMockProjections";
import { toUIOversightSignal } from "@/lib/mappers/collective";

export default function OversightSignalsPage() {
  const signals = mockOversightSignals().map(toUIOversightSignal);

  return (
    <div className="flex flex-col h-full bg-[#0B0C10]">
      <PageHeader
        title="Oversight Signals"
        description="Collective cognition oversight signal feed — read-only observer view"
      />

      {/* DEMO banner */}
      <div className="mx-6 mt-4 rounded border border-[--safety-orange]/40 bg-[--safety-orange]/10 px-4 py-3 font-mono text-xs text-[--safety-orange]">
        <span className="font-bold uppercase tracking-wider">
          Projection-Only
        </span>
        {" — "}
        This view displays demo data. No merged backend contract exists for
        oversight signals.
      </div>

      <div className="flex-1 p-6">
        <OversightSignalPanel signals={signals} />
      </div>
    </div>
  );
}
