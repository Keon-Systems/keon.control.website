import { PageHeader } from "@/ui-kit/components/PageHeader";
import { AdoptionByArtifactClient } from "./adoption-by-artifact-client";

interface AdoptionByArtifactPageProps {
  params: Promise<{ artifactId: string }>;
}

export default async function AdoptionByArtifactPage({ params }: AdoptionByArtifactPageProps) {
  const { artifactId } = await params;
  return (
    <>
      <PageHeader
        title="Adoption Decisions"
        description={`Observed adoption decisions for artifact ${artifactId}`}
      />
      <AdoptionByArtifactClient artifactId={artifactId} />
    </>
  );
}
