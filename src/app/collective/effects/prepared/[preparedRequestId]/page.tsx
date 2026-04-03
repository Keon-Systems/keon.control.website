import { PageHeader } from "@/ui-kit/components/PageHeader";
import { PreparedEffectDetailClient } from "./prepared-effect-detail-client";

interface PreparedEffectDetailPageProps {
  params: Promise<{ preparedRequestId: string }>;
}

export default async function PreparedEffectDetailPage({ params }: PreparedEffectDetailPageProps) {
  const { preparedRequestId } = await params;
  return (
    <>
      <PageHeader
        title="Prepared Effect Request"
        description={`Observed prepared effect ${preparedRequestId} — INERT / NO EXECUTION AUTHORITY`}
      />
      <PreparedEffectDetailClient preparedRequestId={preparedRequestId} />
    </>
  );
}
