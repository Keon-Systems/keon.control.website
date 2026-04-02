import { Panel, PanelContent, PanelHeader } from "@/components/ui";

export default function EvidenceIndexPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="font-mono text-lg uppercase tracking-wider text-[--flash]">
        Evidence Pack Viewer
      </h1>

      <Panel notch noise>
        <PanelHeader>Lookup</PanelHeader>
        <PanelContent>
          <p className="text-sm font-mono text-[--steel]">
            Enter a Run ID to view its evidence pack. Navigate from an execution
            inspector or decision case to view evidence for a specific run.
          </p>
          <p className="text-xs font-mono text-[--tungsten] mt-3">
            ROUTE: /collective/evidence/[runId]
          </p>
        </PanelContent>
      </Panel>
    </div>
  );
}
