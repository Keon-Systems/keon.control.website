"use client";

import * as React from "react";
import { PageContainer } from "@/components/layout/page-container";
import { TenantAuditTrail } from "@/components/tenants/tenant-audit-trail";

export default function TenantAuditPage() {
  return (
    <PageContainer>
      <TenantAuditTrail entries={[]} />
    </PageContainer>
  );
}
