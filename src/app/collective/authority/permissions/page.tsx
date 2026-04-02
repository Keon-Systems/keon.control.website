import { PageHeader } from "@/ui-kit/components/PageHeader";
import { PermissionsListClient } from "./permissions-list-client";

export default function PermissionsListPage() {
  return (
    <>
      <PageHeader
        title="Agent Permission Grants"
        description="Observed agent permission grants and their lifecycle states"
      />
      <PermissionsListClient />
    </>
  );
}
