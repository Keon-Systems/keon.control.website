import { PageHeader } from "@/ui-kit/components/PageHeader";
import { ReformsListClient } from "./reforms-list-client";

export default function ReformsPage() {
  return (
    <>
      <PageHeader
        title="Reform Artifacts"
        description="Collective reform artifacts and their lineage"
      />
      <ReformsListClient />
    </>
  );
}
