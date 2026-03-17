import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";

export interface DeferredPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Name of the deferred feature */
  readonly feature: string;
  /** Prerequisite backend contract or condition */
  readonly prerequisite: string;
}

/**
 * DeferredPanel - Placeholder for backend-absent features.
 *
 * Renders a panel with a "DEFERRED" badge, the feature name,
 * and an explanation of the prerequisite backend contract needed
 * before the feature can be activated.
 */
const DeferredPanel = React.forwardRef<HTMLDivElement, DeferredPanelProps>(
  ({ feature, prerequisite, className, ...props }, ref) => (
    <Panel ref={ref} className={cn("opacity-70", className)} {...props}>
      <PanelHeader>
        <PanelTitle>{feature}</PanelTitle>
        <Badge variant="warning">DEFERRED</Badge>
      </PanelHeader>
      <PanelContent>
        <p className="text-xs font-mono text-[--steel]">{prerequisite}</p>
      </PanelContent>
    </Panel>
  ),
);
DeferredPanel.displayName = "DeferredPanel";

export { DeferredPanel };
