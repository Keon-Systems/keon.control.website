import { Shell } from "@/components/layout";
import {
    Card,
    CardContent,
    CardHeader,
    PageContainer,
    PageHeader,
    PageSection,
} from "@/components/layout/page-container";
import Link from "next/link";

const PAGE_CONTRACT = {
  purpose: "Operator evidence surface for deterministic memory verification through Control.",
  question: "What proof state does Cortex expose right now?",
  allowed: [
    "unified proof bundle",
    "proof spine I1-I7",
    "content-addressed proof identity",
    "temporal receipts",
    "retrieval influence receipts",
    "manifests and deterministic artifacts",
  ],
  forbidden: [
    "vector database positioning",
    "runtime execution governance claims",
    "chat history cache framing",
    "brochure narrative",
  ],
} as const;

const SUMMARY_STATE = [
  ["Truth boundary", "Authoritative store active", "Vector index remains derivative and replayable."],
  ["Proof bundle", "I1-I7 verified", "Merkle root stable and all checks passed in the aggregate bundle."],
  ["Receipt state", "Temporal + influence receipts visible", "Memory state and retrieval influence are inspectable."],
  ["Artifact state", "Proof bundle + benchmark outputs deterministic", "CI-uploaded artifacts support byte-identical gates."],
  ["Governed integrity", "Available in governed mode", "Ed25519 signing and Evidence Pack tamper detection are operator-verifiable."],
] as const;

const PROOF_BUNDLE = [
  ["Command", "cortex proof-bundle [--output FILE]", "Single verify-all export for the full Cortex proof spine."],
  ["Coverage", "I1-I7", "Composes all proof families without redefining their semantics."],
  ["Identity", "proof_bundle_id == merkle_root", "Content-addressed aggregate proof identity through a deterministic SHA-256 Merkle root."],
  ["Status", "all_checks_passed", "Aggregate result is inspectable by operators, CI, buyers, and auditors."],
] as const;

const PROOF_SPINE = [
  ["I1", "Deterministic memory / core proof summary", "cortex proof", "Verify temporal memory commitments and the byte-identical core proof output."],
  ["I2", "Tenant isolation", "cortex tenant-isolation-proof", "Reject missing, aliased, empty, and foreign tenant paths before memory can cross scope."],
  ["I3", "Replay / outbox durability", "cortex replay-proof", "Inspect durable leasing, replay, restart, retry, and no-lost-write behavior."],
  ["I4", "Authoritative store / derivative index", "cortex authority-proof", "Confirm the vector surface is disposable while canonical truth remains authoritative."],
  ["I5", "Deterministic shard identity / idempotent ingestion", "cortex shard-identity-proof", "Check canonical shard identity, retry safety, and duplicate suppression."],
  ["I6", "Decay & reinforcement", "cortex decay-reinforcement-proof", "Review trust floors, ceilings, reinforcement semantics, and deterministic decay behavior."],
  ["I7", "Governed signing / Evidence Pack integrity", "cortex governed-signing-proof", "Validate Ed25519 signing, tamper detection, and historical-key verification coverage."],
] as const;

const RECEIPT_SURFACES = [
  ["Temporal memory receipts", "VISIBLE", "Stronger temporal commitments make memory state reconstructable across time instead of merely claimed."],
  ["Retrieval influence receipts", "INSPECT", "Selected, excluded, ranking, and degradation behavior remain attributable at the operator surface."],
  ["Fact identity + reinforcement", "HARDENED", "Duplicate claims, reinforced facts, and evolving fact slots stay distinct without collapsing lineage."],
  ["Invariant manifest", "LOADED", "I1-I7 manifest coverage is visible as a current verification spine, not a roadmap promise."],
] as const;

const ARTIFACT_REGISTRY = [
  ["Unified proof bundle", "cortex proof-bundle [--output FILE]", "cortex-proof-bundle.json", "Portable courtroom binder for I1-I7, Merkle identity, deterministic double-run gates, and downstream Evidence Pack integration."],
  ["Core proof summary", "cortex proof [--output FILE]", "Deterministic JSON", "Base proof entrypoint for memory correctness and byte-identical proof gating."],
  ["Invariant manifest", "cortex invariant-manifest", "I1-I7 manifest", "Operator-readable spine showing proof coverage and CI assertion scope."],
  ["Benchmark reports", "cortex benchmark", "benchmark-report.json + Markdown", "Deterministic semantic benchmark artifacts include provider metadata for exact attribution."],
  ["Governed integrity", "cortex governed-signing-proof", "cortex-governed-signing-proof.json", "Evidence Pack tamper detection, signer verification, and key lifecycle support."],
] as const;

const MODE_BOUNDARY = [
  ["Open core", "Unsigned open-core receipts remain allowed where governed signing is not enforced."],
  ["Governed mode", "Ed25519 signing, revoked/retired key handling, and Evidence Pack verification activate when governed signing is enabled."],
] as const;

const MEMORY_CONTEXT =
  "Mem0, LangGraph/LangMem, Letta, LlamaIndex, Zep/Graphiti, Cognee, and Hindsight mostly optimize for agents remembering useful context. Cortex optimizes for proving memory correctness under failure, tenancy, replay, indexing drift, trust decay, and governed audit.";

export default function CortexPage() {
  return (
    <Shell>
      <PageContainer>
        <PageHeader
          title="Cortex"
          description="Cockpit evidence for deterministic memory. Proof Bundle: I1-I7 verified, Merkle root stable, all checks passed. Do not trust the memory layer. Verify it."
          actions={
            <div className="flex flex-wrap gap-2">
              <Link
                href="/receipts"
                className="inline-flex h-10 items-center rounded-[8px] border border-[#66FCF1]/30 bg-[#66FCF1]/08 px-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[#66FCF1] transition hover:bg-[#66FCF1]/14"
              >
                Inspect receipts
              </Link>
              <Link
                href="/evidence"
                className="inline-flex h-10 items-center rounded-[8px] border border-white/10 px-4 font-mono text-[10px] uppercase tracking-[0.18em] text-white/70 transition hover:border-white/20 hover:text-white"
              >
                Open evidence
              </Link>
            </div>
          }
        />

        <div className="space-y-6">
          <Card className="border-[#66FCF1]/20 bg-[#66FCF1]/[0.04]">
            <CardContent className="grid gap-4 md:grid-cols-2 font-mono text-sm leading-7 text-[#C5C6C7]">
              <div>Cortex separates canonical memory truth from disposable retrieval surfaces.</div>
              <div>One command emits seven proof families as deterministic, content-addressed evidence.</div>
            </CardContent>
          </Card>

          <PageSection title="Verification state" description="Read Cortex through proof signals, not explanations.">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {SUMMARY_STATE.map(([label, state, body]) => (
                <Card key={label}>
                  <CardContent className="space-y-3">
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#66FCF1]">{label}</div>
                    <div className="font-['Rajdhani'] text-xl font-semibold text-[#C5C6C7]">{state}</div>
                    <p className="font-mono text-sm leading-6 text-[#C5C6C7] opacity-80">{body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </PageSection>

          <PageSection title="Proof bundle" description="Verify-all surface for the Cortex proof spine.">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {PROOF_BUNDLE.map(([label, value, body]) => (
                <Card key={label}>
                  <CardContent className="space-y-3">
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#66FCF1]">{label}</div>
                    <div className="font-['Rajdhani'] text-lg font-semibold text-[#C5C6C7]">{value}</div>
                    <p className="font-mono text-sm leading-6 text-[#C5C6C7] opacity-80">{body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </PageSection>

          <PageSection title="Page contract" description="Truth plane only. No runtime authority claims.">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
              <Card>
                <CardHeader title="Purpose + primary question" />
                <CardContent className="space-y-4 font-mono text-sm leading-6 text-[#C5C6C7]">
                  <div>
                    <div className="text-[#66FCF1]">Purpose</div>
                    <div className="opacity-80">{PAGE_CONTRACT.purpose}</div>
                  </div>
                  <div>
                    <div className="text-[#66FCF1]">Primary question</div>
                    <div className="opacity-80">{PAGE_CONTRACT.question}</div>
                  </div>
                </CardContent>
              </Card>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                <Card>
                  <CardHeader title="Allowed" />
                  <CardContent className="space-y-2 font-mono text-sm text-[#C5C6C7] opacity-80">
                    {PAGE_CONTRACT.allowed.map((item) => (
                      <div key={item}>• {item}</div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader title="Forbidden" />
                  <CardContent className="space-y-2 font-mono text-sm text-[#C5C6C7] opacity-80">
                    {PAGE_CONTRACT.forbidden.map((item) => (
                      <div key={item}>• {item}</div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </PageSection>

          <PageSection title="Invariant manifest / proof spine" description="Operator-readable coverage for I1 through I7.">
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {PROOF_SPINE.map(([id, title, command, body]) => (
                <Card key={id}>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#66FCF1]">
                      <span>{id}</span>
                      <span>{command}</span>
                    </div>
                    <div className="font-['Rajdhani'] text-lg font-semibold text-[#C5C6C7]">{title}</div>
                    <p className="font-mono text-sm leading-6 text-[#C5C6C7] opacity-80">{body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </PageSection>

          <PageSection title="Receipts, manifests, and influence" description="What an operator can inspect before trusting memory behavior.">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {RECEIPT_SURFACES.map(([title, state, body]) => (
                <Card key={title}>
                  <CardContent className="space-y-3">
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#66FCF1]">{state}</div>
                    <div className="font-['Rajdhani'] text-lg font-semibold text-[#C5C6C7]">{title}</div>
                    <p className="font-mono text-sm leading-6 text-[#C5C6C7] opacity-80">{body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </PageSection>

          <PageSection title="Artifact registry" description="Deterministic outputs exposed through Control-visible verification state.">
            <Card>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full min-w-[860px] text-left text-sm text-[#C5C6C7]">
                  <thead className="border-b border-white/10 font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
                    <tr>
                      <th className="px-4 py-3">Surface</th>
                      <th className="px-4 py-3">Command</th>
                      <th className="px-4 py-3">Artifact</th>
                      <th className="px-4 py-3">Operator use</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05] font-mono">
                    {ARTIFACT_REGISTRY.map(([surface, command, artifact, body]) => (
                      <tr key={surface}>
                        <td className="px-4 py-3 text-white/88">{surface}</td>
                        <td className="px-4 py-3 text-[#66FCF1]">{command}</td>
                        <td className="px-4 py-3 text-white/70">{artifact}</td>
                        <td className="px-4 py-3 text-white/70">{body}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </PageSection>

          <PageSection title="Memory correctness boundary" description="Context-memory is not proof of memory correctness.">
            <Card>
              <CardContent className="font-mono text-sm leading-7 text-[#C5C6C7] opacity-85">{MEMORY_CONTEXT}</CardContent>
            </Card>
          </PageSection>

          <PageSection title="Open-core vs governed boundary" description="Governed signing is additive, not a prerequisite for open-core receipts.">
            <div className="grid gap-4 md:grid-cols-2">
              {MODE_BOUNDARY.map(([label, body]) => (
                <Card key={label}>
                  <CardHeader title={label} />
                  <CardContent className="font-mono text-sm leading-6 text-[#C5C6C7] opacity-80">{body}</CardContent>
                </Card>
              ))}
            </div>
          </PageSection>
        </div>
      </PageContainer>
    </Shell>
  );
}
