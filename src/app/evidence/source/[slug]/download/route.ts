import { getEvidenceDoc } from "@/lib/evidence-docs";
import { promises as fs } from "fs";
import path from "path";

interface RouteContext {
  params: Promise<{
    slug: string;
  }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const doc = getEvidenceDoc(slug);
  if (!doc) {
    return new Response("Document not found", { status: 404 });
  }

  const absolutePath = path.join(process.cwd(), doc.filePath);

  try {
    const content = await fs.readFile(absolutePath);
    const filename = path.basename(doc.filePath);
    const contentType = doc.language === "markdown"
      ? "text/markdown; charset=utf-8"
      : "text/plain; charset=utf-8";

    return new Response(content, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename=\"${filename}\"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response("Unable to read document", { status: 500 });
  }
}
