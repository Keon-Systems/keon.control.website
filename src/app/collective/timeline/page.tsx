import { DeferredPanel } from "@/components/ui/deferred-panel";
import { PageHeader } from "@/ui-kit/components/PageHeader";

export default function CivicTimelinePage() {
  return (
    <>
      <PageHeader
        title="Civic Timeline"
        description="Epoch-anchored civic event stream"
      />
      <div className="p-6">
        <DeferredPanel
          feature="Civic Timeline"
          prerequisite="Temporal Event Store API — not yet merged. This view will display epoch-anchored civic events when the backend query surface is available."
        />
      </div>
    </>
  );
}
