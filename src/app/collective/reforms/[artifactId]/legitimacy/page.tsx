import { PageHeader } from "@/ui-kit/components/PageHeader";
import { LegitimacyDetailClient } from "./legitimacy-detail-client";

interface LegitimacyPageProps {
  params: Promise<{ artifactId: string }>;
}

export default async function LegitimacyPage({ params }: LegitimacyPageProps) {
  const { artifactId } = await params;
  return (
    <>
      <PageHeader
        title="Legitimacy Assessment"
        description={`Assessment for reform ${artifactId}`}
      />
      <LegitimacyDetailClient artifactId={artifactId} />
    </>
  );
}
