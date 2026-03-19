"use client";

import type { CollectiveChainDetail, CollectiveChainEdge, CollectiveChainNode } from "@/lib/collective/chain.dto";
import { COLLECTIVE_CHAIN_STAGES } from "@/lib/collective/chain.normalization";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { CollectiveChainDetailRail } from "./collective-chain-detail-rail";
import { CollectiveChainEdgeConnector } from "./collective-chain-edge";
import { CollectiveChainEmptyState } from "./collective-chain-empty-state";
import { CollectiveChainGuidedPanel, GUIDED_CONTENT } from "./collective-chain-guided-panel";
import { CollectiveChainPartialState } from "./collective-chain-partial-state";
import { CollectiveChainStageCard } from "./collective-chain-stage-card";
import { CollectiveChainOnboarding } from "./collective-chain-onboarding";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelContent, PanelHeader, PanelTitle, PanelDescription } from "@/components/ui/panel";
import { Play, RotateCcw, ShieldAlert } from "lucide-react";

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
const GUIDED_TOUR_DISMISSED_KEY = "collective-chain-guided-tour-dismissed";

function readOnboardingDismissed(): boolean {
  try {
    return typeof window !== "undefined" && localStorage.getItem(ONBOARDING_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function readGuidedTourDismissed(): boolean {
  try {
    return typeof window !== "undefined" && localStorage.getItem(GUIDED_TOUR_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function CollectiveChainView({ detail, isLoading, fixtureName }: CollectiveChainViewProps) {
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(detail?.focusedNodeId ?? null);
  const [showOnboarding, setShowOnboarding] = useState(() => !readOnboardingDismissed());

  // Guided tour state
  const [isGuidedMode, setIsGuidedMode] = useState(false);
  const [guidedStepIndex, setGuidedStepIndex] = useState(0);
  const [dismissedGuidedMode, setDismissedGuidedMode] = useState(() => readGuidedTourDismissed());
  const stageCardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Keyboard support: arrow keys and Escape during guided mode
  useEffect(() => {
    if (!isGuidedMode) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setGuidedStepIndex((prev) => Math.min(prev + 1, GUIDED_CONTENT.length - 1));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setGuidedStepIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Escape") {
        e.preventDefault();
        setIsGuidedMode(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isGuidedMode]);

  // Auto-scroll active stage into view during guided mode
  useEffect(() => {
    if (!isGuidedMode) return;
    const el = stageCardRefs.current.get(guidedStepIndex);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [isGuidedMode, guidedStepIndex]);

  const handleSelectNode = useCallback((nodeId: string) => {
    // In guided mode, clicking a card does not change focus — tour controls it
    if (isGuidedMode) return;
    setFocusedNodeId((prev) => (prev === nodeId ? null : nodeId));
  }, [isGuidedMode]);

  const handleDismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "1");
    } catch {
      // Storage unavailable — dismiss is session-only, which is fine
    }
  }, []);

  const handleStartGuidedTour = useCallback(() => {
    setIsGuidedMode(true);
    setGuidedStepIndex(0);
    // Hide onboarding accordion while guided mode is active
    setShowOnboarding(false);
  }, []);

  const handleExitGuidedTour = useCallback(() => {
    setIsGuidedMode(false);
    setDismissedGuidedMode(true);
    try {
      localStorage.setItem(GUIDED_TOUR_DISMISSED_KEY, "1");
    } catch {
      // Storage unavailable
    }
  }, []);

  const handleGuidedNext = useCallback(() => {
    setGuidedStepIndex((prev) => Math.min(prev + 1, GUIDED_CONTENT.length - 1));
  }, []);

  const handleGuidedBack = useCallback(() => {
    setGuidedStepIndex((prev) => Math.max(prev - 1, 0));
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
  const preparedEffectNode = view.nodes.find((node) => node.stage === "preparedEffect" && node.isPresent) ?? null;

  const presentCount = view.completeness.presentStages.length;

  // Guided mode: determine which stage is currently spotlighted
  const guidedStage = isGuidedMode ? COLLECTIVE_CHAIN_STAGES[guidedStepIndex] : null;
  const guidedStageIsPresent = guidedStage
    ? view.completeness.presentStages.includes(guidedStage)
    : false;

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

      {/* Constitutional warning — always visible above the fold */}
      <div className="flex items-center gap-2 px-1">
        <ShieldAlert className="h-3.5 w-3.5 text-[--safety-orange] shrink-0" />
        <p className="font-mono text-[11px] text-[--safety-orange]">
          Viewing this chain does not authorize action.
        </p>
      </div>

      {/* Tour CTA — primary visual lane, left-aligned with chain */}
      <div className="flex items-center gap-3 px-1">
        {isGuidedMode ? (
          <button
            type="button"
            onClick={handleExitGuidedTour}
            className="inline-flex items-center gap-2 rounded-sm border border-[--safety-orange]/40 bg-[--safety-orange]/5 px-3 py-1.5 font-mono text-xs text-[--safety-orange] hover:bg-[--safety-orange]/10 hover:border-[--safety-orange]/60 transition-colors"
          >
            Exit Tour
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStartGuidedTour}
            className={cn(
              "inline-flex items-center gap-2 rounded-sm border border-[--reactor-blue]/50 bg-[--reactor-blue]/5 px-3 py-1.5 font-mono text-xs text-[--reactor-blue] hover:bg-[--reactor-blue]/15 hover:border-[--reactor-blue]/70 transition-all",
              !dismissedGuidedMode && "animate-[tour-pulse_2s_ease-in-out_1]",
            )}
          >
            {dismissedGuidedMode ? (
              <>
                <RotateCcw className="h-3.5 w-3.5" />
                Restart Tour
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                Start Tour
              </>
            )}
          </button>
        )}
        <span className="font-mono text-[10px] text-[--steel]">
          {isGuidedMode
            ? `Step ${guidedStepIndex + 1} of ${GUIDED_CONTENT.length}`
            : dismissedGuidedMode
              ? "Guided walkthrough of the constitutional flow"
              : "Understand how this chain works"}
        </span>
      </div>

      {/* Partial state banner */}
      <CollectiveChainPartialState completeness={view.completeness} />

      {/* Main content: chain + optional detail rail (non-guided only) */}
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

                  // Guided mode spotlight logic
                  const isGuidedFocused = isGuidedMode && node.stage === guidedStage;
                  const isDimmed = isGuidedMode && !isGuidedFocused;
                  const isGuidedMissing = isGuidedFocused && !node.isPresent;

                  return (
                    <div
                      key={node.id}
                      className="flex items-start"
                      ref={(el) => {
                        if (el) {
                          stageCardRefs.current.set(index, el);
                        } else {
                          stageCardRefs.current.delete(index);
                        }
                      }}
                    >
                      <CollectiveChainStageCard
                        node={node}
                        isFocused={isGuidedFocused || (!isGuidedMode && focusedNodeId === node.id)}
                        isDimmed={isDimmed}
                        isGuidedMissing={isGuidedMissing}
                        onSelect={handleSelectNode}
                      />
                      {showEdge && (
                        <div className={cn(
                          "transition-opacity duration-200",
                          isDimmed && "opacity-30",
                        )}>
                          <CollectiveChainEdgeConnector
                            edge={node.isPresent && nextNode?.isPresent ? edge : null}
                          />
                        </div>
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

        {/* Right rail: guided panel OR detail + onboarding */}
        <div className="hidden lg:flex lg:w-80 lg:flex-col lg:gap-4 lg:shrink-0">
          {isGuidedMode ? (
            <CollectiveChainGuidedPanel
              stepIndex={guidedStepIndex}
              isStagePresentInChain={guidedStageIsPresent}
              preparedEffectId={preparedEffectNode?.recordId ?? null}
              onNext={handleGuidedNext}
              onBack={handleGuidedBack}
              onExit={handleExitGuidedTour}
            />
          ) : (
            <>
              <CollectiveChainDetailRail node={focusedNode} />
              {showOnboarding && (
                <CollectiveChainOnboarding onDismiss={handleDismissOnboarding} />
              )}
            </>
          )}
        </div>

        {/* Right rail: detail + onboarding — ONLY in non-guided mode */}
        {!isGuidedMode && (
          <div className="hidden lg:flex lg:w-80 lg:flex-col lg:gap-4 lg:shrink-0">
            <CollectiveChainDetailRail node={focusedNode} />
            {showOnboarding && (
              <CollectiveChainOnboarding onDismiss={handleDismissOnboarding} />
            )}
          </div>
        )}
      </div>

      {/* Guided panel — full width below chain, tightened to lock with chain */}
      {isGuidedMode && (
        <div className="-mt-2">
          <CollectiveChainGuidedPanel
            stepIndex={guidedStepIndex}
            isStagePresentInChain={guidedStageIsPresent}
            preparedEffectId={preparedEffectNode?.recordId ?? null}
            onNext={handleGuidedNext}
            onBack={handleGuidedBack}
            onExit={handleExitGuidedTour}
          />
        </div>
      )}

      {/* Mobile: detail rail below chain when not in guided mode */}
      {!isGuidedMode && (
        <div className="lg:hidden">
          <CollectiveChainDetailRail node={focusedNode} />
          {showOnboarding && (
            <div className="mt-4">
              <CollectiveChainOnboarding onDismiss={handleDismissOnboarding} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
