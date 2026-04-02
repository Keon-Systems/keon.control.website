"use client";

import * as React from "react";
import Link from "next/link";
import { Shell } from "@/components/layout";
import { Card, CardContent, CardHeader, PageContainer, PageHeader } from "@/components/layout/page-container";
import { Input } from "@/components/ui/input";
import { ManifestEntry } from "@/lib/contracts/pt013";
import { formatHash, formatTimestamp } from "@/lib/format";
import { mapThinReceipt, UIThinReceipt } from "@/lib/mappers";
import { ExternalLink, Key, Search } from "lucide-react";

export default function GlobalReceiptsPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [receipts, setReceipts] = React.useState<UIThinReceipt[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      const fixtures = ["happy", "gate_deny"];
      const allReceipts: UIThinReceipt[] = [];

      for (const fixture of fixtures) {
        try {
          const manifestResponse = await fetch(`/mock/pt013/${fixture}/evidence/manifest.json`);
          const manifest = await manifestResponse.json();
          const receiptEntries = manifest.entries.filter((entry: ManifestEntry) => entry.rhid.startsWith("rhid:receipt:"));

          for (const entry of receiptEntries) {
            const safeRhid = entry.rhid.replace(/:/g, "_");
            const receiptResponse = await fetch(`/mock/pt013/${fixture}/evidence/receipts/${safeRhid}.json`);
            const receiptData = await receiptResponse.json();
            allReceipts.push(mapThinReceipt(receiptData));
          }
        } catch (error) {
          console.error(`Failed to load receipts for fixture ${fixture}`, error);
        }
      }

      setReceipts(allReceipts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setIsLoading(false);
    }

    load().catch(() => setIsLoading(false));
  }, []);

  const filteredReceipts = receipts.filter((receipt) =>
    receipt.receiptId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    receipt.actionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    receipt.runId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Shell>
      <PageContainer maxWidth="full">
        <PageHeader
          title="Receipts"
          description="Global explorer for verifiable governance receipts and immutable rulings."
        />

        <Card>
          <CardHeader title="Receipt registry" description="Use receipts to inspect what was bound to each governed action and why." />
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C5C6C7] opacity-50" />
              <Input
                placeholder="Search by receipt ID, action type, or run..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-10 border-[#384656] bg-[#1F2833]/20 pl-10 text-sm"
              />
            </div>

            {isLoading ? (
              <div className="font-mono text-xs opacity-40">Scanning chain of custody...</div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredReceipts.map((receipt) => (
                  <div key={receipt.hash} className="group relative rounded border border-[#384656] bg-[#1F2833]/10 p-4 transition-all hover:border-[#66FCF1]/50">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded bg-[#66FCF1]/10 p-2">
                          <Key className="h-4 w-4 text-[#66FCF1]" />
                        </div>
                        <div>
                          <h4 className="font-mono text-sm text-[#66FCF1]">{receipt.actionType}</h4>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#C5C6C7] opacity-60">Action outcome</span>
                        </div>
                      </div>
                      <Link
                        href={`/runtime/executions/${receipt.runId}`}
                        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#66FCF1] opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        View case <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div>
                        <span className="mb-1 block text-[10px] font-bold uppercase text-[#C5C6C7] opacity-40">Receipt ID</span>
                        <span className="font-mono text-xs text-[#C5C6C7]">{formatHash(receipt.receiptId, 12)}</span>
                      </div>
                      <div>
                        <span className="mb-1 block text-[10px] font-bold uppercase text-[#C5C6C7] opacity-40">Run ID</span>
                        <span className="font-mono text-xs text-[#C5C6C7]">{receipt.runId}</span>
                      </div>
                      <div>
                        <span className="mb-1 block text-[10px] font-bold uppercase text-[#C5C6C7] opacity-40">Timestamp</span>
                        <span className="font-mono text-xs text-[#C5C6C7]">{formatTimestamp(new Date(receipt.timestamp))}</span>
                      </div>
                      <div>
                        <span className="mb-1 block text-[10px] font-bold uppercase text-[#C5C6C7] opacity-40">Chain hash</span>
                        <span className="font-mono text-xs text-[#C5C6C7]">{formatHash(receipt.hash, 16)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredReceipts.length === 0 && (
                  <div className="rounded border border-dashed border-[#384656] py-12 text-center opacity-30">
                    No matching receipts found in current registry scan.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </PageContainer>
    </Shell>
  );
}
