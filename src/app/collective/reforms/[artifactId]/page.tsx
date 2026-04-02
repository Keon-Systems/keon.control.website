import { PageHeader } from "@/ui-kit/components/PageHeader";
import { ReformDetailClient } from "./reform-detail-client";

interface ReformDetailPageProps {
  params: Promise<{ artifactId: string }>;
}

export default async function ReformDetailPage({ params }: ReformDetailPageProps) {
  const { artifactId } = await params;
  return (
    <>
      <PageHeader
        title="Reform Artifact"
        description={`Detail view for ${artifactId}`}
      />
      <ReformDetailClient artifactId={artifactId} />
    </>
  );
}
