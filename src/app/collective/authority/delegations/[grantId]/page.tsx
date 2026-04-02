import { PageHeader } from "@/ui-kit/components/PageHeader";
import { DelegationDetailClient } from "./delegation-detail-client";

interface DelegationDetailPageProps {
  params: Promise<{ grantId: string }>;
}

export default async function DelegationDetailPage({ params }: DelegationDetailPageProps) {
  const { grantId } = await params;
  return (
    <>
      <PageHeader
        title="Delegated Authority Grant"
        description={`Observed grant ${grantId}`}
      />
      <DelegationDetailClient grantId={grantId} />
    </>
  );
}
