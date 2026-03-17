"use client";
import * as React from "react";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

interface FailedInvoice {
  tenantId: string;
  invoiceId: string;
  amountCents?: number;
  amount?: number;
  dunningStep: number;
  status: string;
  failedAt: string;
}

interface CollectionsTableProps {
  items: FailedInvoice[];
}

function getDunningVariant(step: number): "warning" | "critical" | "neutral" {
  if (step >= 4) return "critical";
  if (step >= 2) return "warning";
  return "neutral";
}

export function CollectionsTable({ items }: CollectionsTableProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 opacity-50">
        <AlertCircle className="mb-2 h-8 w-8 text-[#C5C6C7]" />
        <p className="font-mono text-sm text-[#C5C6C7]">No failed invoices</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full font-mono text-sm">
        <thead>
          <tr className="border-b border-[#384656]">
            <th className="pb-2 text-left text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Tenant</th>
            <th className="pb-2 text-left text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Invoice</th>
            <th className="pb-2 text-right text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Amount</th>
            <th className="pb-2 text-center text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Dunning</th>
            <th className="pb-2 text-center text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Status</th>
            <th className="pb-2 text-left text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Failed At</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const amountDollars =
              item.amount !== undefined
                ? item.amount
                : item.amountCents !== undefined
                ? item.amountCents / 100
                : 0;
            return (
              <tr key={item.invoiceId} className="border-b border-[#384656]/40 hover:bg-[#1F2833]/50">
                <td className="py-3 text-[#C5C6C7]">{item.tenantId}</td>
                <td className="py-3 text-[#66FCF1]">{item.invoiceId}</td>
                <td className="py-3 text-right text-[#C5C6C7]">{formatCurrency(amountDollars)}</td>
                <td className="py-3 text-center">
                  <Badge variant={getDunningVariant(item.dunningStep)}>
                    Step {item.dunningStep}
                  </Badge>
                </td>
                <td className="py-3 text-center">
                  <Badge variant={item.status === "open" ? "warning" : "neutral"}>
                    {item.status}
                  </Badge>
                </td>
                <td className="py-3 text-xs text-[#C5C6C7] opacity-70">
                  {new Date(item.failedAt).toLocaleDateString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
