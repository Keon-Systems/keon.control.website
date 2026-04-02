import { PageHeader } from "@/ui-kit/components/PageHeader";
import { LegitimacyExplorerClient } from "./legitimacy-explorer-client";

export default function LegitimacyExplorerPage() {
  return (
    <>
      <PageHeader
        title="Legitimacy Explorer"
        description="Cross-reform legitimacy comparison"
      />
      <LegitimacyExplorerClient />
    </>
  );
}
