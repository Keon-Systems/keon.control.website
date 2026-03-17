"use client";

import * as React from "react";
import { Card, CardHeader, CardContent } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Ticket, User } from "lucide-react";
import Link from "next/link";

interface SupportTicket {
  ticketId: string;
  tenantId: string;
  tenantName: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  lastReplyAt: string;
  assignee: string | null;
}

interface TicketQueueProps {
  tickets: SupportTicket[];
}

function priorityVariant(priority: string): "healthy" | "warning" | "critical" | "default" {
  switch (priority) {
    case "urgent": return "critical";
    case "high": return "warning";
    case "normal": return "default";
    default: return "default";
  }
}

function statusVariant(status: string): "healthy" | "warning" | "default" {
  switch (status) {
    case "open": return "warning";
    case "pending": return "default";
    case "resolved": return "healthy";
    default: return "default";
  }
}

export function TicketQueue({ tickets }: TicketQueueProps) {
  return (
    <Card>
      <CardHeader
        title="Support Queue"
        description={`${tickets.length} ticket${tickets.length !== 1 ? "s" : ""}`}
      />
      <CardContent>
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Ticket className="h-8 w-8 text-[#384656]" />
            <p className="font-mono text-sm text-[#C5C6C7] opacity-50">No tickets in queue</p>
          </div>
        ) : (
          <div className="divide-y divide-[#384656]">
            {tickets.map((ticket) => (
              <div key={ticket.ticketId} className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-[#66FCF1]">{ticket.ticketId}</span>
                      <Badge variant={priorityVariant(ticket.priority)} className="uppercase">
                        {ticket.priority}
                      </Badge>
                      <Badge variant={statusVariant(ticket.status)} className="uppercase">
                        {ticket.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm font-medium text-[#C5C6C7]">{ticket.subject}</p>
                    <div className="mt-1 flex items-center gap-3 font-mono text-xs text-[#C5C6C7] opacity-60">
                      <Link
                        href={`/tenants/${ticket.tenantId}`}
                        className="hover:text-[#66FCF1] hover:opacity-100 transition-colors"
                      >
                        {ticket.tenantName}
                      </Link>
                      <span>&middot;</span>
                      <span>Updated {new Date(ticket.lastReplyAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="flex items-center gap-1.5 font-mono text-xs text-[#C5C6C7] opacity-60">
                      <User className="h-3 w-3" />
                      {ticket.assignee ?? "Unassigned"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
