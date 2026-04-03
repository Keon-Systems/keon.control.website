"use client";

import Link from "next/link";
import { Badge, Panel, PanelContent, PanelHeader } from "@/components/ui";
import { cn } from "@/lib/utils";

type PolicyVersion = {
  policyId: string;
  version: string;
  hash: string;
  lineage?: {
    prevVersion?: string | null;
    supersededBy?: string | null;
  };
  contentRef?: {
    type: string;
    path: string;
  };
};

const MOCK_VERSIONS: Record<string, PolicyVersion> = {
  "pol-risk-threshold-001": {
    policyId: "pol-risk-threshold-001",
    version: "3.1.0",
    hash: "sha256:a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
    lineage: {
      prevVersion: "3.0.0",
      supersededBy: null,
    },
    contentRef: {
      type: "blob",
      path: "policies/risk-threshold/v3.1.0.yaml",
    },
  },
  "pol-data-retention-002": {
    policyId: "pol-data-retention-002",
    version: "2.0.1",
    hash: "sha256:b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
    lineage: {
      prevVersion: "2.0.0",
      supersededBy: null,
    },
    contentRef: {
      type: "blob",
      path: "policies/data-retention/v2.0.1.yaml",
    },
  },
  "pol-access-control-003": {
    policyId: "pol-access-control-003",
    version: "1.4.0",
    hash: "sha256:c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3",
    lineage: {
      prevVersion: "1.3.0",
      supersededBy: null,
    },
    contentRef: {
      type: "blob",
      path: "policies/access-control/v1.4.0.yaml",
    },
  },
  "pol-audit-trail-004": {
    policyId: "pol-audit-trail-004",
    version: "1.0.0",
    hash: "sha256:d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
    lineage: {
      prevVersion: null,
      supersededBy: null,
    },
    contentRef: {
      type: "blob",
      path: "policies/audit-trail/v1.0.0.yaml",
    },
  },
};

function truncateHash(hash: string): string {
  const hex = hash.replace("sha256:", "");
  return hex.slice(0, 16);
}

export function PolicyVersionClient({ policyId }: { policyId: string }) {
  const policy = MOCK_VERSIONS[policyId];

  if (!policy) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="font-mono text-lg uppercase tracking-wider text-[--flash]">
          Policy Not Found
        </h1>
        <Panel notch noise>
          <PanelContent>
            <p className="font-mono text-sm text-[--steel]">
              No policy found for ID: {policyId}
            </p>
            <Link
              href="/collective/policies"
              className="font-mono text-sm text-[--reactor-blue] hover:underline mt-2 inline-block"
            >
              Back to catalog
            </Link>
          </PanelContent>
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/collective/policies"
          className="font-mono text-xs text-[--steel] hover:text-[--reactor-blue]"
        >
          CATALOG
        </Link>
        <span className="font-mono text-xs text-[--tungsten]">/</span>
        <h1 className="font-mono text-lg uppercase tracking-wider text-[--flash]">
          {policy.policyId}
        </h1>
      </div>

      {/* Policy Details */}
      <Panel notch noise>
        <PanelHeader>Policy Version</PanelHeader>
        <PanelContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                Policy ID
              </p>
              <p className="font-mono text-sm text-[--flash]">{policy.policyId}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                Version
              </p>
              <p className="font-mono text-sm text-[--flash]">{policy.version}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                Hash
              </p>
              <p className="font-mono text-sm text-[--steel]" title={policy.hash}>
                sha256:{truncateHash(policy.hash)}
              </p>
            </div>
          </div>
        </PanelContent>
      </Panel>

      {/* Lineage Chain */}
      <Panel noise>
        <PanelHeader>Lineage Chain</PanelHeader>
        <PanelContent>
          <div className="flex items-center gap-3 font-mono text-sm">
            {/* Previous Version */}
            <div
              className={cn(
                "border px-3 py-2 rounded-sm",
                policy.lineage?.prevVersion
                  ? "border-[--tungsten] text-[--steel]"
                  : "border-[--tungsten]/30 text-[--tungsten]"
              )}
            >
              {policy.lineage?.prevVersion ? (
                <Link
                  href={`/collective/policies/${policy.policyId}?v=${policy.lineage.prevVersion}`}
                  className="text-[--reactor-blue] hover:underline"
                >
                  v{policy.lineage.prevVersion}
                </Link>
              ) : (
                <span>ORIGIN</span>
              )}
            </div>

            {/* Arrow */}
            <span className="text-[--tungsten]">&rarr;</span>

            {/* Current Version (highlighted) */}
            <div className="border border-[--reactor-blue] bg-[--reactor-blue]/10 px-3 py-2 rounded-sm shadow-[0_0_6px_rgba(69,162,158,0.3)]">
              <span className="text-[--reactor-blue]">v{policy.version}</span>
              <Badge variant="healthy" className="ml-2">
                CURRENT
              </Badge>
            </div>

            {/* Arrow */}
            <span className="text-[--tungsten]">&rarr;</span>

            {/* Superseded By */}
            <div
              className={cn(
                "border px-3 py-2 rounded-sm",
                policy.lineage?.supersededBy
                  ? "border-[--tungsten] text-[--steel]"
                  : "border-[--tungsten]/30 text-[--tungsten]"
              )}
            >
              {policy.lineage?.supersededBy ? (
                <Link
                  href={`/collective/policies/${policy.policyId}?v=${policy.lineage.supersededBy}`}
                  className="text-[--reactor-blue] hover:underline"
                >
                  v{policy.lineage.supersededBy}
                </Link>
              ) : (
                <span>HEAD</span>
              )}
            </div>
          </div>
        </PanelContent>
      </Panel>

      {/* Content Reference */}
      {policy.contentRef && (
        <Panel noise>
          <PanelHeader>Content Reference</PanelHeader>
          <PanelContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                  Type
                </p>
                <p className="font-mono text-sm text-[--flash]">{policy.contentRef.type}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                  Path
                </p>
                <p className="font-mono text-sm text-[--steel]">{policy.contentRef.path}</p>
              </div>
            </div>
          </PanelContent>
        </Panel>
      )}
    </div>
  );
}
