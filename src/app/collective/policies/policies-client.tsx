"use client";

import Link from "next/link";
import { Panel, PanelContent, PanelHeader } from "@/components/ui";

type PolicyListItem = {
  policyId: string;
  title: string;
  latestVersion: string;
  latestHash: string;
  updatedAt: string;
};

const MOCK_POLICIES: PolicyListItem[] = [
  {
    policyId: "pol-risk-threshold-001",
    title: "Risk Threshold Enforcement",
    latestVersion: "3.1.0",
    latestHash: "sha256:a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
    updatedAt: "2026-03-14T10:30:00Z",
  },
  {
    policyId: "pol-data-retention-002",
    title: "Data Retention Policy",
    latestVersion: "2.0.1",
    latestHash: "sha256:b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
    updatedAt: "2026-03-12T14:15:00Z",
  },
  {
    policyId: "pol-access-control-003",
    title: "Access Control Matrix",
    latestVersion: "1.4.0",
    latestHash: "sha256:c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3",
    updatedAt: "2026-03-10T09:00:00Z",
  },
  {
    policyId: "pol-audit-trail-004",
    title: "Audit Trail Requirements",
    latestVersion: "1.0.0",
    latestHash: "sha256:d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
    updatedAt: "2026-03-08T16:45:00Z",
  },
];

function truncateHash(hash: string): string {
  const hex = hash.replace("sha256:", "");
  return hex.slice(0, 16);
}

export function PolicyCatalogClient() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="font-mono text-lg uppercase tracking-wider text-[--flash]">
        Policy Catalog
      </h1>

      <Panel notch noise>
        <PanelHeader>Registered Policies</PanelHeader>
        <PanelContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-sm">
              <thead>
                <tr className="border-b border-[--tungsten]">
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wide text-[--tungsten]">
                    Policy ID
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wide text-[--tungsten]">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wide text-[--tungsten]">
                    Version
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wide text-[--tungsten]">
                    Hash
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wide text-[--tungsten]">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody>
                {MOCK_POLICIES.map((policy) => (
                  <tr
                    key={policy.policyId}
                    className="border-b border-[--tungsten]/30 hover:bg-[--tungsten]/10 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/collective/policies/${policy.policyId}`}
                        className="text-[--reactor-blue] hover:underline"
                      >
                        {policy.policyId}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[--flash]">
                      {policy.title}
                    </td>
                    <td className="px-4 py-3 text-[--steel]">
                      {policy.latestVersion}
                    </td>
                    <td className="px-4 py-3 text-[--steel]" title={policy.latestHash}>
                      {truncateHash(policy.latestHash)}
                    </td>
                    <td className="px-4 py-3 text-[--steel]">
                      {new Date(policy.updatedAt).toISOString().slice(0, 19).replace("T", " ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PanelContent>
      </Panel>
    </div>
  );
}
