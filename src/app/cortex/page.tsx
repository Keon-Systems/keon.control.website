import { Shell } from "@/components/layout";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import Link from "next/link";

const CORTEX_PROPERTIES = [
  {
    title: "Deterministic recall",
    description:
      "AI systems retrieve the same canonical answer given the same context. No hallucinated memory. No diverging recall across sessions.",
  },
  {
    title: "Canonical identity",
    description:
      "Every shard has a stable, addressable identity. Updates are idempotent — writing the same fact twice does not create duplicates or drift.",
  },
  {
    title: "Fail-closed tenant isolation",
    description:
      "Context never crosses tenant boundaries. If isolation cannot be verified, the retrieval fails closed instead of leaking.",
  },
  {
    title: "Policy-bound ingestion",
    description:
      "Memory is only accepted through governed ingestion paths. Unverified context cannot enter the knowledge boundary.",
  },
] as const;

const CORTEX_VS_VECTOR = [
  { concept: "Storage model", vector: "Approximate similarity index", cortex: "Canonical identity graph" },
  { concept: "Recall guarantee", vector: "Probabilistic", cortex: "Deterministic" },
  { concept: "Tenant isolation", vector: "Application-layer", cortex: "Fail-closed at retrieval" },
  { concept: "Ingestion", vector: "Unguarded writes", cortex: "Policy-bound, idempotent" },
] as const;

export default function CortexPage() {
  return (
    <Shell>
      <PageContainer>
        <PageHeader
          title="Cortex"
          description="Deterministic memory for governed AI systems. Vector databases optimize for similarity — Cortex optimizes for correctness."
        />

        <div className="space-y-8">
          {/* Properties grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {CORTEX_PROPERTIES.map((prop) => (
              <div
                key={prop.title}
                className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6"
              >
                <div className="font-mono text-xs uppercase tracking-[0.22em] text-[#7EE8E0]">
                  {prop.title}
                </div>
                <p className="mt-3 text-sm leading-7 text-white/72">{prop.description}</p>
              </div>
            ))}
          </div>

          {/* Comparison table */}
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
            <div className="font-mono text-xs uppercase tracking-[0.22em] text-white/50 mb-5">
              Vector databases are not memory
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="pb-3 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-white/40 pr-6">Concept</th>
                    <th className="pb-3 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-white/40 pr-6">Vector index</th>
                    <th className="pb-3 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-[#7EE8E0]">Cortex</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {CORTEX_VS_VECTOR.map((row) => (
                    <tr key={row.concept}>
                      <td className="py-3 pr-6 text-white/50">{row.concept}</td>
                      <td className="py-3 pr-6 text-white/50">{row.vector}</td>
                      <td className="py-3 text-white/85">{row.cortex}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-[24px] border border-[#7EE8E0]/20 bg-[#7EE8E0]/05 p-6">
            <div className="font-mono text-xs uppercase tracking-[0.22em] text-[#7EE8E0] mb-3">
              Enable Cortex for your workspace
            </div>
            <p className="text-sm leading-7 text-white/72 mb-4">
              Cortex is available as a governed memory layer for workspaces running Keon Runtime.
              Requires API integration and workspace configuration.
            </p>
            <Link
              href="/integrations"
              className="inline-flex h-10 items-center rounded-[8px] border border-[#7EE8E0]/30 bg-[#7EE8E0]/08 px-5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#7EE8E0] transition hover:bg-[#7EE8E0]/14"
            >
              Go to Integrations
            </Link>
          </div>
        </div>
      </PageContainer>
    </Shell>
  );
}
