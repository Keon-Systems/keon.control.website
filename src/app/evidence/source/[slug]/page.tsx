import { getEvidenceDoc } from "@/lib/evidence-docs";
import Link from "next/link";
import { notFound } from "next/navigation";
import path from "path";
import { promises as fs } from "fs";

interface EvidenceDocPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: EvidenceDocPageProps) {
  const doc = getEvidenceDoc(params.slug);
  if (!doc) {
    return {
      title: "Document",
      description: "",
    };
  }
  return {
    title: doc.label,
    description: doc.description,
  };
}

export default async function EvidenceDocPage({ params }: EvidenceDocPageProps) {
  const doc = getEvidenceDoc(params.slug);
  if (!doc) {
    notFound();
  }

  const absolutePath = path.join(process.cwd(), doc.filePath);
  let content = "";
  try {
    content = await fs.readFile(absolutePath, "utf-8");
  } catch (error) {
    console.error("Unable to read document:", error);
    content = "Unable to load the requested document.";
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl text-[--flash]">Source documents</h1>
        <p className="text-sm text-[--steel]">{doc.description}</p>
        <Link
          href={`/evidence/source/${doc.slug}/download`}
          className="inline-block text-xs font-mono uppercase tracking-[0.4em] text-[--reactor-glow]"
        >
          Download
        </Link>
      </header>

      <section className="rounded border border-[#384656] bg-[#0E1118] p-5 text-sm text-[--steel]">
        <p className="text-[11px] uppercase tracking-[0.3em] text-[--steel]">{doc.label}</p>
        <p className="mb-4 text-xs text-[--steel]">{doc.filePath}</p>
        <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap text-[13px] leading-relaxed text-[--flash]">
          {content}
        </pre>
      </section>

      <Link
        href="/evidence/golden-path"
        className="text-xs font-mono uppercase tracking-[0.4em] text-[--reactor-glow]"
      >
        Back to Golden Path
      </Link>
    </div>
  );
}
