"use client";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

interface Message {
  messageId: string;
  subject: string;
  tenantIds: string[] | string;
  channel: string;
  status: string;
  sentAt: string;
}

interface MessageHistoryTableProps {
  messages: Message[];
}

function tenantCount(tenantIds: string[] | string): string {
  if (tenantIds === "all") return "All";
  if (Array.isArray(tenantIds)) return String(tenantIds.length);
  return "1";
}

export function MessageHistoryTable({ messages }: MessageHistoryTableProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 opacity-50">
        <AlertCircle className="mb-2 h-8 w-8 text-[#C5C6C7]" />
        <p className="font-mono text-sm text-[#C5C6C7]">No messages sent</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded border border-[#384656]">
      <table className="w-full min-w-[720px] font-mono text-sm">
        <thead>
          <tr className="border-b border-[#384656]">
            <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wide">Subject</th>
            <th className="px-4 py-3 text-center text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wide">Tenants</th>
            <th className="px-4 py-3 text-center text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wide">Channel</th>
            <th className="px-4 py-3 text-center text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wide">Status</th>
            <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wide">Sent At</th>
          </tr>
        </thead>
        <tbody>
          {messages.map((msg) => (
            <tr key={msg.messageId} className="border-b border-[#384656]/40 hover:bg-[#1F2833]/50">
              <td className="px-4 py-3.5 text-[13px] leading-[1.6] text-[#C5C6C7] sm:text-sm">{msg.subject}</td>
              <td className="px-4 py-3.5 text-center text-[13px] text-[#C5C6C7] sm:text-sm">{tenantCount(msg.tenantIds)}</td>
              <td className="px-4 py-3.5 text-center">
                <Badge variant="neutral">{msg.channel}</Badge>
              </td>
              <td className="px-4 py-3.5 text-center">
                <Badge variant={msg.status === "sent" ? "healthy" : "warning"}>{msg.status}</Badge>
              </td>
              <td className="px-4 py-3.5 text-[12px] text-[#C5C6C7] opacity-70 sm:text-xs">
                {new Date(msg.sentAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
