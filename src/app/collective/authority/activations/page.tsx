import { PageHeader } from "@/ui-kit/components/PageHeader";
import { ActivationsListClient } from "./activations-list-client";

export default function ActivationsListPage() {
  return (
    <>
      <PageHeader
        title="Authority Activations"
        description="Observed authority activations and their lifecycle states"
      />
      <ActivationsListClient />
    </>
  );
}
