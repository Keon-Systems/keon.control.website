"use client";

import * as React from "react";
import { TenantScopeGuard } from "@/components/control-plane";
import { Shell } from "@/components/layout";
import { Card, CardContent, CardHeader, PageContainer, PageHeader } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { listApiKeys } from "@/lib/api/control-plane";
import type { ApiKeyPreview } from "@/lib/api/types";
import { useTenantBinding } from "@/lib/control-plane/tenant-binding";

export default function ApiKeysPage() {
  const { isConfirmed, confirmedTenant, confirmedEnvironment } = useTenantBinding();
  const [keys, setKeys] = React.useState<ApiKeyPreview[]>([]);

  React.useEffect(() => {
    async function load() {
      if (!confirmedTenant) {
        setKeys([]);
        return;
      }

      setKeys(await listApiKeys(confirmedTenant.id));
    }

    load().catch(() => setKeys([]));
  }, [confirmedTenant]);

  return (
    <Shell>
      <PageContainer>
        <PageHeader title="API Keys" description="Live and test credentials for the explicitly bound tenant and environment." />

        {!isConfirmed && <TenantScopeGuard description="Credential surfaces require explicit tenant and environment confirmation." />}

        {isConfirmed && confirmedTenant && (
          <div className="space-y-4">
            <Card>
              <CardHeader title="Bound credential scope" description="Credential issuance now follows explicit tenant binding instead of implicit membership order." />
              <CardContent className="font-mono text-sm text-[#C5C6C7]">
                <div>Tenant: {confirmedTenant.name}</div>
                <div>Environment: {confirmedEnvironment}</div>
                <div>Keys in scope: {keys.length}</div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4">
              {keys.map((key) => (
                <Card key={key.id}>
                  <CardHeader
                    title={key.name}
                    description={<span className="font-mono text-xs text-[#C5C6C7] opacity-60">keon_{key.mode}_{key.prefix}_...</span>}
                    actions={<Badge variant={key.mode === "live" ? "warning" : "healthy"}>{key.mode}</Badge>}
                  />
                  <CardContent className="grid grid-cols-1 gap-2 md:grid-cols-4">
                    <div className="font-mono text-sm text-[#C5C6C7]">Status: {key.status}</div>
                    <div className="font-mono text-sm text-[#C5C6C7]">Environment: {key.environmentId}</div>
                    <div className="font-mono text-sm text-[#C5C6C7]">Last used: {key.lastUsedAtUtc ?? "never"}</div>
                    <div className="font-mono text-sm text-[#C5C6C7]">Shown once: yes</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </PageContainer>
    </Shell>
  );
}
