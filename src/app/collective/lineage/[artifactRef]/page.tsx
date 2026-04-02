import { DeferredPanel } from "@/components/ui/deferred-panel";
import { PageHeader } from "@/ui-kit/components/PageHeader";

export default function ArtifactLineagePage() {
  return (
    <>
      <PageHeader
        title="Artifact Lineage Inspector"
        description="DAG visualization of artifact provenance chains"
      />
      <div className="p-6">
        <DeferredPanel
          feature="Artifact Lineage Inspector"
          prerequisite="Lineage Graph API — not yet merged. This view will display a DAG visualization of artifact lineage when the backend query surface is available."
        />
      </div>
    </>
  );
}
