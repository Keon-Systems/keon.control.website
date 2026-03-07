export type EvidenceDoc = {
  slug: string;
  label: string;
  description: string;
  filePath: string;
  language: "markdown" | "powershell" | "text";
};

const registry: EvidenceDoc[] = [
  {
    slug: "start-here",
    label: "START_HERE.md",
    description: "Repository entrypoint for buyers and evidence walkthroughs.",
    filePath: "docs/START_HERE.md",
    language: "markdown",
  },
  {
    slug: "buyer-wow",
    label: "BUYER_WOW.md",
    description: "Golden Path readiness report and talking points for buyers.",
    filePath: "docs/BUYER_WOW.md",
    language: "markdown",
  },
  {
    slug: "api-surface",
    label: "API_SURFACE_SNAPSHOT.md",
    description: "Snapshot of the control-plane surfaces used by the Golden Path.",
    filePath: "docs/API_SURFACE_SNAPSHOT.md",
    language: "markdown",
  },
  {
    slug: "run-golden-path",
    label: "samples/buyer-wow/run.ps1",
    description: "Buyer WOW single-command Golden Path execution script.",
    filePath: "samples/buyer-wow/run.ps1",
    language: "powershell",
  },
  {
    slug: "verify-pack",
    label: "samples/golden-path/verify-pack.ps1",
    description: "Pack verification script that exports the proof JSON.",
    filePath: "samples/golden-path/verify-pack.ps1",
    language: "powershell",
  },
  {
    slug: "whitepaper-v2",
    label: "whitepaper/whitepaper.md",
    description: "Canonical Keon constitutional execution whitepaper (v2.0).",
    filePath: "docs/whitepaper/whitepaper.md",
    language: "markdown",
  },
];

export const evidenceDocRegistry = registry;

export function getEvidenceDoc(slug: string) {
  return registry.find((doc) => doc.slug === slug) ?? null;
}
