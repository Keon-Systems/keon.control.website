"use client";

import { CollectiveStatusHeader } from "@/components/collective";
import { Badge } from "@/components/ui";
import { DataSourceNotice } from "@/components/layout";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { DeliberationSession, ReformArtifact, ReformLegitimacyAssessment } from "@/lib/contracts/collective";

interface CollectiveOverviewState {
  readonly kind: "loading" | "unavailable" | "ready";
  readonly reason?: string;
  readonly deliberations?: readonly DeliberationSession[];
  readonly reforms?: readonly ReformArtifact[];
  readonly legitimacyAssessments?: readonly ReformLegitimacyAssessment[];
}

function statusBadgeVariant(status: string) {
  switch (status) {
    case "active":
      return "healthy" as const;
    case "concluded":
      return "neutral" as const;
    case "archived":
      return "offline" as const;
    default:
      return "neutral" as const;
  }
}

function reformStatusBadgeVariant(status: string) {
  switch (status) {
    case "hosted":
      return "healthy" as const;
    case "superseded":
      return "warning" as const;
    case "withdrawn":
      return "offline" as const;
    default:
      return "neutral" as const;
  }
}

export default function CollectiveOverviewPage() {
  const [state, setState] = useState<CollectiveOverviewState>({ kind: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const [deliberationsRes, reformsRes, legitimacyRes] = await Promise.all([
          fetch("/api/collective/deliberations", { cache: "no-store", signal: controller.signal }),
          fetch("/api/collective/reforms", { cache: "no-store", signal: controller.signal }),
          fetch("/api/collective/legitimacy", { cache: "no-store", signal: controller.signal }),
        ]);

        if (!deliberationsRes.ok || !reformsRes.ok || !legitimacyRes.ok) {
          throw new Error("One or more review endpoints returned a non-success response.");
        }

        const [deliberationsData, reformsData, legitimacyData] = await Promise.all([
          deliberationsRes.json() as Promise<{ items: DeliberationSession[] }>,
          reformsRes.json() as Promise<{ items: ReformArtifact[] }>,
          legitimacyRes.json() as Promise<{ items: ReformLegitimacyAssessment[] }>,
        ]);

        setState({
          kind: "ready",
          deliberations: deliberationsData.items,
          reforms: reformsData.items,
          legitimacyAssessments: legitimacyData.items,
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        const reason = error instanceof Error ? error.message : String(error);
        setState({ kind: "unavailable", reason });
      }
    }

    load();
    return () => controller.abort();
  }, []);

  if (state.kind === "loading") {
    return (
      <div className="space-y-6">
        <header className="space-y-3">
          <h1 className="font-display text-3xl text-[--flash]">Collaborative review</h1>
          <p className="text-sm text-[--steel]">Loading review activity and recent decision threads.</p>
        </header>
        <div className="rounded border border-[#384656] bg-[#1F2833] p-6 text-center">
          <Badge variant="neutral">LOADING</Badge>
          <p className="mt-2 font-mono text-xs text-[--steel]">Checking recent review activity...</p>
        </div>
      </div>
    );
  }

  if (state.kind === "unavailable") {
    return (
      <div className="space-y-6">
        <header className="space-y-3">
          <h1 className="font-display text-3xl text-[--flash]">Collaborative review</h1>
        </header>
        <div className="rounded border border-[#384656] bg-[#1F2833] p-6">
          <Badge variant="critical">UNAVAILABLE</Badge>
          <p className="mt-2 font-mono text-sm uppercase tracking-wide text-[--flash]">Review workspace unavailable</p>
          <p className="mt-1 break-words font-mono text-xs text-[--steel]">{state.reason}</p>
        </div>
      </div>
    );
  }

  const deliberations = state.deliberations ?? [];
  const reforms = state.reforms ?? [];
  const legitimacyAssessments = state.legitimacyAssessments ?? [];
  const activeDeliberations = deliberations.filter((d) => d.status === "active").length;
  const recentDeliberations = [...deliberations].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()).slice(0, 5);
  const recentReforms = [...reforms].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Visual hero — restored from showcase experience */}
      <div className="relative overflow-hidden rounded-[24px] border border-[#1e2d3d] bg-[#0a1018] mb-8">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15"
          style={{ backgroundImage: "url('/images/keon-orbit-2.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1018] via-[#0a1018]/85 to-transparent" />

        <div className="relative z-10 p-8">
          {/* Eyebrow */}
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#7EE8E0] mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7EE8E0]" />
            Keon Collective · Group Cognition Layer
          </div>

          <h2 className="font-display text-3xl font-bold text-white leading-tight mb-3 max-w-lg">
            Decisions that{" "}
            <span className="text-[#7EE8E0]">transcend</span>{" "}
            the individual.
          </h2>
          <p className="text-sm leading-7 text-white/65 max-w-xl mb-6">
            AI proposals branch across multiple entities, face adversarial challenge, collect
            votes, and collapse into cryptographically-sealed outcomes — governed decisions no
            single system could reach alone.
          </p>

          {/* Lifecycle pipeline */}
          <div className="relative flex items-center gap-0 max-w-2xl mb-6">
            <div className="absolute left-0 right-0 top-1/2 h-px bg-[#7EE8E0]/15 -translate-y-1/2" />
            {(["Proposal", "Branch", "Adversarial", "Vote", "Collapse", "Sealed"] as const).map((step, i) => (
              <div key={step} className="relative flex flex-col items-center gap-2 flex-1">
                <div
                  className={`h-8 w-8 rounded-full border flex items-center justify-center font-mono text-[9px] font-bold ${
                    i === 2
                      ? "border-[#F4D35E] bg-[#F4D35E] text-[#0a1018]"
                      : i === 5
                      ? "border-[#7EE8E0] bg-[#7EE8E0] text-[#0a1018]"
                      : "border-[#7EE8E0]/30 bg-[#0a1018] text-[#7EE8E0]/55"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <span
                  className={`font-mono text-[8px] uppercase tracking-[0.12em] ${
                    i === 2 ? "text-[#F4D35E]" : i === 5 ? "text-[#7EE8E0]" : "text-white/30"
                  }`}
                >
                  {step}
                </span>
              </div>
            ))}
          </div>

          {/* Live metrics from fetched data */}
          <div className="flex gap-8 pt-4 border-t border-white/[0.07]">
            <div>
              <div className="font-display text-2xl font-bold text-white">{activeDeliberations}</div>
              <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/38 mt-0.5">Active deliberations</div>
            </div>
            <div>
              <div className="font-display text-2xl font-bold text-white">{deliberations.length}</div>
              <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/38 mt-0.5">Total deliberations</div>
            </div>
            <div>
              <div className="font-display text-2xl font-bold text-white">{reforms.length}</div>
              <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/38 mt-0.5">Reform artifacts</div>
            </div>
          </div>
        </div>
      </div>

      <header className="space-y-3">
        <h1 className="font-display text-2xl text-[--flash]">Active review sessions</h1>
        <p className="text-sm text-[--steel]">
          Live deliberations, recent reform artifacts, and legitimacy assessments for your workspace.
        </p>
      </header>

      <section className="rounded border border-[--reactor-blue] bg-[#081316] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Badge variant="healthy">START A REVIEW</Badge>
            <h2 className="font-display text-2xl text-[--flash]">Open a live review session</h2>
            <p className="max-w-3xl text-sm text-[--steel]">
              Start a real collaborative review, bind the right workspace and reviewer identity, and inspect the resulting artifacts.
            </p>
          </div>
          <Link href="/collective/submit" className="inline-flex h-10 items-center justify-center border border-[--reactor-blue] bg-[--reactor-blue] px-4 font-mono text-xs uppercase tracking-widest text-[--void] transition-colors hover:bg-[--reactor-glow]">
            Open live review
          </Link>
          <Link href="/collective/runs" className="inline-flex h-10 items-center justify-center border border-[--tungsten] px-4 font-mono text-xs uppercase tracking-widest text-[--flash] transition-colors hover:border-[--reactor-blue]">
            Review recent runs
          </Link>
        </div>
      </section>

      <DataSourceNotice
        title="Sample data in this overview"
        description="The overview cards and lists below currently use sample or projection data for preview purposes. They do not represent activity from your connected systems."
      />

      <CollectiveStatusHeader
        activeDeliberations={activeDeliberations}
        totalReformArtifacts={reforms.length}
        recentLegitimacyAssessments={legitimacyAssessments.length}
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-wider text-[--steel]">Recent review threads</h2>
          <Link href="/collective/deliberations" className="font-mono text-xs uppercase tracking-wider text-[--reactor-glow] hover:underline">
            View all
          </Link>
        </div>

        {recentDeliberations.length === 0 ? (
          <div className="rounded border border-[#384656] bg-[#0B0C10] p-4 text-center font-mono text-xs text-[--steel]">
            No review threads are available yet. Start a live review when you need one.
          </div>
        ) : (
          <div className="space-y-2">
            {recentDeliberations.map((d) => (
              <Link key={d.id} href={`/collective/deliberations/${d.id}`} className="flex items-center justify-between rounded border border-[#384656] bg-[#0E1118] px-4 py-3 transition-colors hover:border-[--reactor-blue]">
                <div className="space-y-1">
                  <div className="font-mono text-sm text-[--flash]">{d.topic}</div>
                  <div className="font-mono text-[10px] text-[--steel]">
                    REVIEWERS: {d.participants.length} | STARTED: {new Date(d.startedAt).toLocaleDateString()}
                  </div>
                </div>
                <Badge variant={statusBadgeVariant(d.status)}>{d.status.toUpperCase()}</Badge>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-wider text-[--steel]">Recent change proposals</h2>
          <Link href="/collective/reforms" className="font-mono text-xs uppercase tracking-wider text-[--reactor-glow] hover:underline">
            View all
          </Link>
        </div>

        {recentReforms.length === 0 ? (
          <div className="rounded border border-[#384656] bg-[#0B0C10] p-4 text-center font-mono text-xs text-[--steel]">
            No change proposals are available yet.
          </div>
        ) : (
          <div className="space-y-2">
            {recentReforms.map((r) => (
              <Link key={r.id} href={`/collective/reforms/${r.id}`} className="flex items-center justify-between rounded border border-[#384656] bg-[#0E1118] px-4 py-3 transition-colors hover:border-[--reactor-blue]">
                <div className="space-y-1">
                  <div className="font-mono text-sm text-[--flash]">{r.title}</div>
                  <div className="font-mono text-[10px] text-[--steel]">
                    AUTHOR: {r.authorId} | CREATED: {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <Badge variant={reformStatusBadgeVariant(r.status)}>{r.status.toUpperCase()}</Badge>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
