"use client";

import { Badge } from "@/components/ui/badge";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import type { StrategyMutationReceiptGroup, StrategyMutationReceiptView } from "@/lib/collective/dto";
import { toneToVariant } from "@/lib/collective/ui-bridge";
import { LineageAnchorBadge } from "./lineage-anchor-badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StrategyMutationReceiptPanelProps {
  readonly groups: readonly StrategyMutationReceiptGroup[];
}

function ReceiptEntry({ receipt }: { readonly receipt: StrategyMutationReceiptView }) {
  const variant = toneToVariant(receipt.operationPresentation.tone);

  return (
    <div className="space-y-2 rounded border border-[#384656] bg-[#0B0C10] p-3">
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant={variant}>
                {receipt.operationPresentation.label}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <span className="font-mono text-xs">
                raw: {receipt.operationPresentation.raw}
              </span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span className="text-[10px] font-mono text-[#C5C6C7]/50">
          Recorded {new Date(receipt.recordedAtUtc).toLocaleString()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div>
          <span className="text-[#C5C6C7]/50">Receipt ID</span>
          <p className="font-mono text-[#C5C6C7] text-[11px]">{receipt.receiptId}</p>
        </div>
        <div>
          <span className="text-[#C5C6C7]/50">Epoch</span>
          <p className="font-mono text-[#C5C6C7]">{receipt.anchorEpochId}</p>
        </div>
      </div>

      {receipt.anchorReceiptRefs.length > 0 && (
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#C5C6C7]/50 block mb-1">
            Anchor Receipts
          </span>
          <div className="flex flex-wrap gap-1.5">
            {receipt.anchorReceiptRefs.map((ref) => (
              <LineageAnchorBadge key={ref} rhid={ref} />
            ))}
          </div>
        </div>
      )}

      {receipt.lineageRefs.length > 0 && (
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#C5C6C7]/50 block mb-1">
            Lineage
          </span>
          <div className="flex flex-wrap gap-1.5">
            {receipt.lineageRefs.map((ref) => (
              <LineageAnchorBadge key={ref} rhid={ref} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function StrategyMutationReceiptPanel({ groups }: StrategyMutationReceiptPanelProps) {
  if (groups.length === 0) return null;

  const allReceipts = groups.flatMap((g) => g.receipts);
  if (allReceipts.length === 0) return null;

  return (
    <Panel glow>
      <PanelHeader>
        <PanelTitle>Recorded Strategy Mutations</PanelTitle>
      </PanelHeader>
      <PanelContent>
        <div className="space-y-3">
          {allReceipts.map((receipt) => (
            <ReceiptEntry key={receipt.receiptId} receipt={receipt} />
          ))}
        </div>
      </PanelContent>
    </Panel>
  );
}
