import { PageHeader } from "@/ui-kit/components/PageHeader";
import { AdoptionDetailClient } from "./adoption-detail-client";

interface AdoptionDetailPageProps {
  params: Promise<{ decisionId: string }>;
}

export default async function AdoptionDetailPage({ params }: AdoptionDetailPageProps) {
  const { decisionId } = await params;
  return (
    <>
      <PageHeader
        title="Adoption Decision"
        description={`Observed decision ${decisionId}`}
      />
      <AdoptionDetailClient decisionId={decisionId} />
    </>
  );
}
