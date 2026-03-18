import type { CollectiveChainEntrypointKind } from "@/lib/collective/chain.dto";
import { ChainViewClient } from "./chain-view-client";

const VALID_KINDS = new Set<string>([
  "artifact",
  "activation",
  "preparedEffect",
  "decision",
  "delegation",
]);

interface ChainPageProps {
  params: Promise<{ kind: string; id: string }>;
  searchParams: Promise<{ focus?: string }>;
}

export default async function ChainPage({ params, searchParams }: ChainPageProps) {
  const { kind, id } = await params;
  const { focus } = await searchParams;

  if (!VALID_KINDS.has(kind)) {
    return (
      <div className="p-6">
        <p className="font-mono text-xs text-[--ballistic-red]">
          Unknown entrypoint kind: {kind}
        </p>
      </div>
    );
  }

  return (
    <ChainViewClient
      kind={kind as CollectiveChainEntrypointKind}
      id={decodeURIComponent(id)}
      focusNodeId={focus ?? null}
    />
  );
}
