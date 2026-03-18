"use client";

import type { CollectiveChainDetail, CollectiveChainEdge, CollectiveChainNode } from "@/lib/collective/chain.dto";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";
import { CollectiveChainDetailRail } from "./collective-chain-detail-rail";
import { CollectiveChainEdgeConnector } from "./collective-chain-edge";
import { CollectiveChainEmptyState } from "./collective-chain-empty-state";
import { CollectiveChainPartialState } from "./collective-chain-partial-state";
import { CollectiveChainStageCard } from "./collective-chain-stage-card";
import { CollectiveChainOnboarding } from "./collective-chain-onboarding";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelContent, PanelHeader, PanelTitle, PanelDescription } from "@/components/ui/panel";

interface CollectiveChainViewProps {
  readonly detail: CollectiveChainDetail | null;
  readonly isLoading?: boolean;
  readonly fixtureName?: string | null;
}

function findEdgeBetween(
  edges: readonly CollectiveChainEdge[],
  fromNodeId: string,
  toNodeId: string,
): CollectiveChainEdge | null {
  return edges.find((e) => e.fromNodeId === fromNodeId && e.toNodeId === toNodeId) ?? null;
}

const ONBOARDING_STORAGE_KEY = "collective-chain-onboarding-dismissed";

function readOnboardingDismissed(): boolean {
  try {
    return typeof window !== "undefined" && localStorage.getItem(ONBOARDING_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function CollectiveChainView({ detail, isLoading, fixtureName }: CollectiveChainViewProps) {
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(detail?.focusedNodeId ?? null);
  const [showOnboarding, setShowOnboarding] = useState(true);

  // Hydrate from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    if (readOnboardingDismissed()) {
      setShowOnboarding(false);
    }
  }, []);

  const handleSelectNode = useCallback((nodeId: string) => {
    setFocusedNodeId((prev) => (prev === nodeId ? null : nodeId));
  }, []);

  const handleDismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "1");
    } catch {
      // Storage unavailable — dismiss is session-only, which is fine
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="font-mono text-xs text-[--steel] animate-pulse">
          Resolving constitutional chain...
        </p>
      </div>
    );
  }

  if (!detail) {
    return <CollectiveChainEmptyState />;
  }

  const { view } = detail;
  const focusedNode = focusedNodeId
    ? view.nodes.find((n) => n.id === focusedNodeId) ?? null
    : null;

  const presentCount = view.completeness.presentStages.length;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <Panel notch>
        <PanelHeader>
          <div className="flex items-center gap-3">
            <PanelTitle>Constitutional Chain</PanelTitle>
            <Badge variant={view.completeness.isPartial ? "warning" : "healthy"}>
              {presentCount}/8 stages
            </Badge>
            {fixtureName && (
              <Badge variant="neutral">MOCK DATA</Badge>
            )}
          </div>
          <PanelDescription>
            Read-only observation of the constitutional pipeline
          </PanelDescription>
        </PanelHeader>
      </Panel>

      {/* Partial state banner */}
      <CollectiveChainPartialState completeness={view.completeness} />

      {/* Main content: chain + detail rail */}
      <div className="flex gap-4">
        {/* Chain visualization */}
        <div className="flex-1 min-w-0">
          <Panel noise>
            <PanelContent className="overflow-x-auto">
              <div className="flex items-start py-4 px-2">
                {view.nodes.map((node: CollectiveChainNode, index: number) => {
                  const nextNode = view.nodes[index + 1];
                  const edge = nextNode
                    ? findEdgeBetween(view.edges, node.id, nextNode.id)
                    : null;
                  const showEdge = index < view.nodes.length - 1;

                  return (
                    <div key={node.id} className="flex items-start">
                      <CollectiveChainStageCard
                        node={node}
                        isFocused={focusedNodeId === node.id}
                        onSelect={handleSelectNode}
                      />
                      {showEdge && (
                        <CollectiveChainEdgeConnector
                          edge={node.isPresent && nextNode?.isPresent ? edge : null}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </PanelContent>
          </Panel>

          {/* Observational disclaimer */}
          <p className="mt-2 text-[10px] font-mono text-[--tungsten] text-center">
            Viewing a chain does not authorize action.
          </p>
        </div>

        {/* Right rail: detail + onboarding */}
        <div className="hidden lg:flex lg:w-80 lg:flex-col lg:gap-4 lg:shrink-0">
          <CollectiveChainDetailRail node={focusedNode} />
          {showOnboarding && (
            <CollectiveChainOnboarding onDismiss={handleDismissOnboarding} />
          )}
        </div>
      </div>

      {/* Mobile detail: below chain */}
      <div className="lg:hidden">
        <CollectiveChainDetailRail node={focusedNode} />
        {showOnboarding && (
          <div className="mt-4">
            <CollectiveChainOnboarding onDismiss={handleDismissOnboarding} />
          </div>
        )}
      </div>
    </div>
  );
}
