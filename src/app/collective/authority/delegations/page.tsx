import { PageHeader } from "@/ui-kit/components/PageHeader";
import { DelegationsListClient } from "./delegations-list-client";

export default function DelegationsPage() {
  return (
    <>
      <PageHeader
        title="Delegated Authority Grants"
        description="Observed delegated authority grants and their lifecycle states"
      />
      <DelegationsListClient />
    </>
  );
}
