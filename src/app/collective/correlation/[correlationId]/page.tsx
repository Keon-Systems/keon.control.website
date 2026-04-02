import { CorrelationDetailClient } from "./correlation-detail-client";

export default async function CorrelationDetailPage({
  params,
}: {
  params: Promise<{ correlationId: string }>;
}) {
  const { correlationId } = await params;
  return <CorrelationDetailClient correlationId={correlationId} />;
}
