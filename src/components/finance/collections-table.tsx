"use client";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
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
    <div className="overflow-x-auto rounded border border-[#384656]">
      <table className="w-full min-w-[760px] font-mono text-sm">
        <thead>
          <tr className="border-b border-[#384656]">
            <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wide">Tenant</th>
            <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wide">Invoice</th>
            <th className="px-4 py-3 text-right text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wide">Amount</th>
            <th className="px-4 py-3 text-center text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wide">Dunning</th>
            <th className="px-4 py-3 text-center text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wide">Status</th>
            <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wide">Failed At</th>
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
                <td className="px-4 py-3.5 text-[13px] text-[#C5C6C7] sm:text-sm">{item.tenantId}</td>
                <td className="px-4 py-3.5 text-[13px] text-[#66FCF1] sm:text-sm">{item.invoiceId}</td>
                <td className="px-4 py-3.5 text-right text-[13px] text-[#C5C6C7] sm:text-sm">{formatCurrency(amountDollars)}</td>
                <td className="px-4 py-3.5 text-center">
                  <Badge variant={getDunningVariant(item.dunningStep)}>
                    Step {item.dunningStep}
                  </Badge>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <Badge variant={item.status === "open" ? "warning" : "neutral"}>
                    {item.status}
                  </Badge>
                </td>
                <td className="px-4 py-3.5 text-[12px] text-[#C5C6C7] opacity-70 sm:text-xs">
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
