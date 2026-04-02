"use client";

import { CollectiveChainView } from "@/components/collective/collective-chain-view";
import type { CollectiveChainDetail, CollectiveChainEntrypointKind } from "@/lib/collective/chain.dto";
import { collectiveChainQueryKeys } from "@/lib/collective/chain.queryKeys";
import { useQuery } from "@tanstack/react-query";

interface ChainViewClientProps {
  readonly kind: CollectiveChainEntrypointKind;
  readonly id: string;
  readonly focusNodeId?: string | null;
}

async function fetchChainDetail(kind: string, id: string, focus?: string | null): Promise<CollectiveChainDetail> {
  const params = new URLSearchParams();
  if (focus) params.set("focus", focus);
  const query = params.toString();
  const url = `/api/collective/chain/${encodeURIComponent(kind)}/${encodeURIComponent(id)}${query ? `?${query}` : ""}`;

  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) return null as unknown as CollectiveChainDetail;
    throw new Error(`Failed to fetch chain: ${res.status}`);
  }
  const envelope = await res.json();
  return envelope.data;
}

export function ChainViewClient({ kind, id, focusNodeId }: ChainViewClientProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: collectiveChainQueryKeys.focus(
      `${kind}/${id}`,
      focusNodeId,
    ),
    queryFn: () => fetchChainDetail(kind, id, focusNodeId),
  });

  if (error) {
    return (
      <div className="p-6">
        <p className="font-mono text-xs text-[--ballistic-red]">
          Failed to resolve constitutional chain.
        </p>
        <p className="mt-1 font-mono text-[10px] text-[--tungsten]">
          {(error as Error).message}
        </p>
      </div>
    );
  }

  return (
    <CollectiveChainView
      detail={data ?? null}
      isLoading={isLoading}
      fixtureName={data?.view?.fixtureName}
    />
  );
}
