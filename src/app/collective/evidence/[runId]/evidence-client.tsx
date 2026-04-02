"use client";

import { useParams } from "next/navigation";
import { Badge, Panel, PanelContent, PanelHeader } from "@/components/ui";

type Artifact = {
  name: string;
  sha256: string;
  sizeBytes: number;
};

type EvidencePack = {
  runId: string;
  packId: string;
  seal: {
    sealHash: string;
    manifestHash: string;
    verified: boolean;
  };
  artifacts: Artifact[];
  links: {
    manifest: string;
    export: string;
  };
};

function truncateHash(hash: string): string {
  if (hash.length <= 24) return hash;
  return `${hash.slice(0, 16)}...${hash.slice(-8)}`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function buildMockEvidence(runId: string): EvidencePack {
  return {
    runId,
    packId: "pack-2026-03-16-0001",
    seal: {
      sealHash:
        "sha256:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
      manifestHash:
        "sha256:f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5",
      verified: true,
    },
    artifacts: [
      {
        name: "governance-receipt.json",
        sha256:
          "sha256:1111111111111111111111111111111111111111111111111111111111111111",
        sizeBytes: 4096,
      },
      {
        name: "policy-evaluation.json",
        sha256:
          "sha256:2222222222222222222222222222222222222222222222222222222222222222",
        sizeBytes: 12288,
      },
      {
        name: "llm-trace.jsonl",
        sha256:
          "sha256:3333333333333333333333333333333333333333333333333333333333333333",
        sizeBytes: 524288,
      },
      {
        name: "tool-calls.jsonl",
        sha256:
          "sha256:4444444444444444444444444444444444444444444444444444444444444444",
        sizeBytes: 65536,
      },
    ],
    links: {
      manifest: `/api/evidence/${runId}/manifest`,
      export: `/api/evidence/${runId}/export`,
    },
  };
}

export function EvidencePackClient() {
  const params = useParams<{ runId: string }>();
  const runId = params.runId;
  const evidence = buildMockEvidence(runId);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="font-mono text-lg uppercase tracking-wider text-[--flash]">
          Evidence Pack
        </h1>
        <Badge variant="warning">MOCK</Badge>
      </div>

      {/* Pack Identity */}
      <Panel notch noise>
        <PanelHeader>Pack Identity</PanelHeader>
        <PanelContent>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                RUN ID
              </p>
              <p className="text-sm font-mono text-[--flash]">
                {evidence.runId}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                PACK ID
              </p>
              <p className="text-sm font-mono text-[--flash]">
                {evidence.packId}
              </p>
            </div>
          </div>
        </PanelContent>
      </Panel>

      {/* Seal Status */}
      <Panel notch noise>
        <PanelHeader>
          <span className="font-mono text-sm uppercase tracking-wider text-[--flash]">
            Seal Status
          </span>
          <Badge
            variant={evidence.seal.verified ? "healthy" : "critical"}
          >
            {evidence.seal.verified ? "VERIFIED" : "UNVERIFIED"}
          </Badge>
        </PanelHeader>
        <PanelContent>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                SEAL HASH
              </p>
              <p
                className="text-xs font-mono text-[--steel]"
                title={evidence.seal.sealHash}
              >
                {truncateHash(evidence.seal.sealHash)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
                MANIFEST HASH
              </p>
              <p
                className="text-xs font-mono text-[--steel]"
                title={evidence.seal.manifestHash}
              >
                {truncateHash(evidence.seal.manifestHash)}
              </p>
            </div>
          </div>
        </PanelContent>
      </Panel>

      {/* Artifacts */}
      <Panel notch noise>
        <PanelHeader>
          <span className="font-mono text-sm uppercase tracking-wider text-[--flash]">
            Artifacts
          </span>
          <span className="text-[10px] font-mono text-[--tungsten]">
            {evidence.artifacts.length} ITEMS
          </span>
        </PanelHeader>
        <PanelContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[--tungsten]">
                  <th className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten] pb-2 pr-4">
                    NAME
                  </th>
                  <th className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten] pb-2 pr-4">
                    SHA256
                  </th>
                  <th className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten] pb-2 text-right">
                    SIZE
                  </th>
                </tr>
              </thead>
              <tbody>
                {evidence.artifacts.map((artifact) => (
                  <tr
                    key={artifact.name}
                    className="border-b border-[--tungsten] last:border-b-0"
                  >
                    <td className="py-2 pr-4">
                      <p className="text-sm font-mono text-[--flash]">
                        {artifact.name}
                      </p>
                    </td>
                    <td className="py-2 pr-4">
                      <p
                        className="text-xs font-mono text-[--steel]"
                        title={artifact.sha256}
                      >
                        {truncateHash(artifact.sha256)}
                      </p>
                    </td>
                    <td className="py-2 text-right">
                      <p className="text-xs font-mono text-[--steel]">
                        {formatBytes(artifact.sizeBytes)}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PanelContent>
      </Panel>

      {/* Links (read-only display) */}
      <Panel noise>
        <PanelHeader>Pack Links</PanelHeader>
        <PanelContent className="space-y-3">
          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
              MANIFEST URL
            </p>
            <p className="text-xs font-mono text-[--reactor-blue]">
              {evidence.links.manifest}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-wide text-[--tungsten]">
              EXPORT URL
            </p>
            <p className="text-xs font-mono text-[--reactor-blue]">
              {evidence.links.export}
            </p>
          </div>
        </PanelContent>
      </Panel>
    </div>
  );
}
