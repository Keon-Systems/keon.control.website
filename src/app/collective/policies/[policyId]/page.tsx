import { PolicyVersionClient } from "./policy-version-client";

export default async function PolicyVersionPage({
  params,
}: {
  params: Promise<{ policyId: string }>;
}) {
  const { policyId } = await params;
  return <PolicyVersionClient policyId={policyId} />;
}
