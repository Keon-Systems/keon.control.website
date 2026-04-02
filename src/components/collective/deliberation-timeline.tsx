"use client";

import { Badge } from "@/components/ui/badge";
import { formatTimestamp } from "@/lib/format";
import type { UIDeliberationSession } from "@/lib/mappers/collective";
import { cn } from "@/lib/utils";
import { Clock, MessageSquare, Users } from "lucide-react";
import Link from "next/link";

interface DeliberationTimelineProps {
  sessions: UIDeliberationSession[];
}

export function DeliberationTimeline({ sessions }: DeliberationTimelineProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-[#384656] rounded opacity-30">
        No deliberation sessions found.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {sessions.map((session, idx) => (
        <Link
          key={session.id}
          href={`/collective/deliberations/${session.id}`}
          className={cn(
            "group relative flex border-b border-[#384656] p-4 transition-all hover:bg-[#384656]/20"
          )}
        >
          {/* Sequence gutter */}
          <div className="mr-4 flex flex-col items-center">
            <span className="font-mono text-[10px] text-[#C5C6C7] opacity-40">
              {(idx + 1).toString().padStart(3, "0")}
            </span>
            <div
              className={cn(
                "my-2 h-full w-px bg-[#384656]",
                idx === sessions.length - 1 && "h-0"
              )}
            />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-[#66FCF1] opacity-70" />
                <span className="font-mono text-sm font-bold text-[#66FCF1]">
                  {session.topic}
                </span>
              </div>
              <Badge variant={session.statusBadgeVariant}>
                {session.status.toUpperCase()}
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Users className="h-3 w-3 text-[#C5C6C7] opacity-40" />
                <span className="font-mono text-xs text-[#C5C6C7]">
                  {session.participantCount} participant{session.participantCount !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-[#C5C6C7] opacity-40" />
                <span className="font-mono text-xs text-[#C5C6C7] opacity-70">
                  {session.durationLabel}
                </span>
              </div>

              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-[10px] text-[#C5C6C7] opacity-40 uppercase font-bold">
                  Started
                </span>
                <span className="font-mono text-xs text-[#C5C6C7] opacity-70">
                  {formatTimestamp(new Date(session.startedAt))}
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
