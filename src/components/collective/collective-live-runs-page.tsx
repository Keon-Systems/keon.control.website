"use client";

import { Badge, Button, Panel, PanelContent, PanelDescription, PanelHeader, PanelTitle } from "@/components/ui";
import {
    serverSnapshotCollectiveLiveRunIndex,
    snapshotCollectiveLiveRunIndex,
    subscribeCollectiveLiveRunIndex,
} from "@/lib/collective/live-run";
import Link from "next/link";
import { useSyncExternalStore } from "react";

export function CollectiveLiveRunsPage() {
  const runs = useSyncExternalStore(
    subscribeCollectiveLiveRunIndex,
    snapshotCollectiveLiveRunIndex,
    serverSnapshotCollectiveLiveRunIndex,
  );

  return (
    <div className="space-y-4">
      <Panel notch glow>
        <PanelHeader>
          <div className="space-y-1">
            <PanelTitle>Recent Collective Runs</PanelTitle>
            <PanelDescription>
              Browser-durable run registry for reopening previously submitted live Collective runs.
            </PanelDescription>
          </div>
          <Badge variant="healthy">RECOVERABLE</Badge>
        </PanelHeader>
        <PanelContent className="space-y-3">
          {runs.length === 0 ? (
            <div className="rounded border border-[--tungsten] bg-[--void] p-4 text-sm text-[--steel]">
              No live Collective runs are indexed on this browser yet.
            </div>
          ) : (
            runs.map((run) => (
              <Link
                key={run.intentId}
                href={`/collective/live/${encodeURIComponent(run.intentId)}`}
                className="block rounded border border-[--tungsten] bg-[--void] p-4 transition-colors hover:border-[--reactor-blue]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-[--flash]">{run.objective}</p>
                    <p className="mt-1 font-mono text-[11px] text-[--steel]">
                      {run.intentId} · {run.correlationId}
                    </p>
                  </div>
                  <Badge variant="healthy">{run.statusLabel}</Badge>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  <div className="font-mono text-[11px] text-[--steel]">Tenant: {run.tenantId}</div>
                  <div className="font-mono text-[11px] text-[--steel]">Actor: {run.actorId}</div>
                  <div className="font-mono text-[11px] text-[--steel]">Submitted: {new Date(run.submittedAtUtc).toLocaleString()}</div>
                </div>
              </Link>
            ))
          )}
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/collective/submit">Submit New Run</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/collective">Back To Collective</Link>
            </Button>
          </div>
        </PanelContent>
      </Panel>
    </div>
  );
}
