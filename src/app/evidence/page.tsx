import Link from "next/link";

const primaryActions = [
  {
    title: "Golden Path Walkthrough",
    description: "Run the single-command flow and identify the artifacts that matter.",
    href: "/evidence/golden-path",
  },
  {
    title: "Verify a Pack Hash",
    description: "Validate a proof output and inspect the verification result.",
    href: "/evidence/verify",
  },
  {
    title: "View a Pack",
    description: "Inspect a pack by pack_hash and review its key fields.",
    href: "/evidence/pack",
  },
];

const secondaryDocs = [
  { label: "View START_HERE", href: "/evidence/source/start-here" },
  { label: "View BUYER_WOW", href: "/evidence/source/buyer-wow" },
  { label: "View API Surface Snapshot", href: "/evidence/source/api-surface" },
  { label: "View Whitepaper", href: "/evidence/source/whitepaper-v2" },
  { label: "Download Whitepaper", href: "/evidence/source/whitepaper-v2/download" },
];

export default function EvidenceLandingPage() {
  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <h1 className="font-display text-3xl text-[--flash]">Evidence Mode</h1>
        <p className="text-sm text-[--steel]">
          Keon produces deterministic Evidence Packs and verification proofs.
        </p>
        <p className="text-sm text-[--steel]">
          This section shows how to generate, inspect, and verify them.
        </p>
      </header>

      <section>
        <div className="grid gap-4 md:grid-cols-3">
          {primaryActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="flex flex-col justify-between rounded border border-[#384656] bg-[#0E1118] p-5 shadow-[0_0_8px_rgba(0,0,0,0.3)] transition-colors hover:border-[--reactor-blue]"
            >
              <div className="space-y-2">
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-[--steel]">Primary action</p>
                <h2 className="text-lg font-display text-[--flash]">{action.title}</h2>
                <p className="text-sm text-[--steel]">{action.description}</p>
              </div>
              <span className="text-xs font-mono uppercase tracking-[0.4em] text-[--reactor-glow]">Go</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap gap-3 text-xs font-mono uppercase tracking-[0.2em] text-[--steel]">
          {secondaryDocs.map((doc) => (
            <Link
              key={doc.label}
              href={doc.href}
              className="rounded border border-transparent px-3 py-1 transition-colors hover:border-[--tungsten] hover:text-[--reactor-glow]"
            >
              {doc.label}
            </Link>
          ))}
        </div>
      </section>

      <footer className="text-xs text-[--steel]">
        Keon verification is designed to be independent of the runtime that produced the pack.
      </footer>
    </div>
  );
}
