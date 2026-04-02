import { PageHeader } from "@/ui-kit/components/PageHeader";
import { PermissionDetailClient } from "./permission-detail-client";

interface PermissionDetailPageProps {
  params: Promise<{ grantId: string }>;
}

export default async function PermissionDetailPage({ params }: PermissionDetailPageProps) {
  const { grantId } = await params;
  return (
    <>
      <PageHeader
        title="Agent Permission Grant"
        description={`Observed grant ${grantId}`}
      />
      <PermissionDetailClient grantId={grantId} />
    </>
  );
}
