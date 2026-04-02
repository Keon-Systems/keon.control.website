"use client";
import * as React from "react";
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
    <div className="overflow-x-auto">
      <table className="w-full font-mono text-sm">
        <thead>
          <tr className="border-b border-[#384656]">
            <th className="pb-2 text-left text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Subject</th>
            <th className="pb-2 text-center text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Tenants</th>
            <th className="pb-2 text-center text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Channel</th>
            <th className="pb-2 text-center text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Status</th>
            <th className="pb-2 text-left text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Sent At</th>
          </tr>
        </thead>
        <tbody>
          {messages.map((msg) => (
            <tr key={msg.messageId} className="border-b border-[#384656]/40 hover:bg-[#1F2833]/50">
              <td className="py-3 text-[#C5C6C7]">{msg.subject}</td>
              <td className="py-3 text-center text-[#C5C6C7]">{tenantCount(msg.tenantIds)}</td>
              <td className="py-3 text-center">
                <Badge variant="neutral">{msg.channel}</Badge>
              </td>
              <td className="py-3 text-center">
                <Badge variant={msg.status === "sent" ? "healthy" : "warning"}>{msg.status}</Badge>
              </td>
              <td className="py-3 text-xs text-[#C5C6C7] opacity-70">
                {new Date(msg.sentAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
