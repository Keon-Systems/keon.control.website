import { PageHeader } from "@/ui-kit/components/PageHeader";
import { AdoptionListClient } from "./adoption-list-client";

export default function AdoptionListPage() {
  return (
    <>
      <PageHeader
        title="Adoption Decisions"
        description="Observed reform adoption decisions and their dispositions"
      />
      <AdoptionListClient />
    </>
  );
}
