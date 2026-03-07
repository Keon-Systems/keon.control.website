"use client";

import * as React from "react";
import { Shell } from "@/components/layout";
import { PageContainer, PageHeader, Card, CardContent, CardHeader } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { listApiKeys, listControlTenants } from "@/lib/api/control-plane";
import type { ApiKeyPreview } from "@/lib/api/types";

export default function ApiKeysPage() {
  const [keys, setKeys] = React.useState<ApiKeyPreview[]>([]);

  React.useEffect(() => {
    async function load() {
      const tenants = await listControlTenants();
      if (tenants[0]) {
        setKeys(await listApiKeys(tenants[0].id));
      }
    }

    load().catch(() => setKeys([]));
  }, []);

  return (
    <Shell>
      <PageContainer>
        <PageHeader title="API Keys" description="Live and test credentials. Full secret is shown only once at creation." />
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
                <div className="font-mono text-sm text-[#C5C6C7]">Last Used: {key.lastUsedAtUtc ?? "never"}</div>
                <div className="font-mono text-sm text-[#C5C6C7]">Shown Once: YES</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </PageContainer>
    </Shell>
  );
}
