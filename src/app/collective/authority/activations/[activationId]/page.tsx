import { PageHeader } from "@/ui-kit/components/PageHeader";
import { ActivationDetailClient } from "./activation-detail-client";

interface ActivationDetailPageProps {
  params: Promise<{ activationId: string }>;
}

export default async function ActivationDetailPage({ params }: ActivationDetailPageProps) {
  const { activationId } = await params;
  return (
    <>
      <PageHeader
        title="Authority Activation"
        description={`Observed activation ${activationId}`}
      />
      <ActivationDetailClient activationId={activationId} />
    </>
  );
}
