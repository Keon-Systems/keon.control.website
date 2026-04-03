import { Badge, Panel, PanelContent, PanelHeader } from "@/components/ui";

interface DeferredPanelProps {
  title: string;
  description: string;
  prerequisite: string;
}

export function DeferredPanel({ title, description, prerequisite }: DeferredPanelProps) {
  return (
    <Panel className="opacity-50">
      <PanelHeader>
        <div className="flex items-center gap-3">
          <h3 className="font-mono text-sm uppercase tracking-wider text-[--steel]">
            {title}
          </h3>
          <Badge variant="offline">DEFERRED</Badge>
        </div>
      </PanelHeader>
      <PanelContent className="space-y-2">
        <p className="text-xs font-mono text-[--steel]">{description}</p>
        <div className="border-t border-[--tungsten] pt-2">
          <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
            PREREQUISITE
          </p>
          <p className="text-xs font-mono text-[--steel]">{prerequisite}</p>
        </div>
      </PanelContent>
    </Panel>
  );
}
