import { PageHeader } from "@/ui-kit/components/PageHeader";
import { PreparedEffectsListClient } from "./prepared-effects-list-client";

export default function PreparedEffectsPage() {
  return (
    <>
      <PageHeader
        title="Prepared Effect Requests"
        description="Observed prepared effect requests — PREPARATION ONLY"
      />
      <PreparedEffectsListClient />
    </>
  );
}
