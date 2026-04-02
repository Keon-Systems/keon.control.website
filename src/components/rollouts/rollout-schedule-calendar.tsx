"use client";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Calendar } from "lucide-react";

interface MaintenanceWindow {
  windowId: string;
  name?: string;
  scheduledStart: string;
  scheduledEnd: string;
  affectedServices?: string[];
  status?: string;
}

interface RolloutScheduleCalendarProps {
  windows: MaintenanceWindow[];
}

export function RolloutScheduleCalendar({ windows }: RolloutScheduleCalendarProps) {
  if (windows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 opacity-50">
        <Calendar className="mb-2 h-8 w-8 text-[#C5C6C7]" />
        <p className="font-mono text-sm text-[#C5C6C7]">No maintenance windows scheduled</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full font-mono text-sm">
        <thead>
          <tr className="border-b border-[#384656]">
            <th className="pb-2 text-left text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Window</th>
            <th className="pb-2 text-left text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Start</th>
            <th className="pb-2 text-left text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">End</th>
            <th className="pb-2 text-left text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Affected Services</th>
            <th className="pb-2 text-center text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Status</th>
          </tr>
        </thead>
        <tbody>
          {windows.map((win) => (
            <tr key={win.windowId} className="border-b border-[#384656]/40 hover:bg-[#1F2833]/50">
              <td className="py-3 text-[#C5C6C7]">{win.name ?? win.windowId}</td>
              <td className="py-3 text-xs text-[#C5C6C7] opacity-70">
                {new Date(win.scheduledStart).toLocaleString()}
              </td>
              <td className="py-3 text-xs text-[#C5C6C7] opacity-70">
                {new Date(win.scheduledEnd).toLocaleString()}
              </td>
              <td className="py-3">
                <div className="flex flex-wrap gap-1">
                  {(win.affectedServices ?? []).map((svc) => (
                    <Badge key={svc} variant="neutral">{svc}</Badge>
                  ))}
                  {!win.affectedServices?.length && (
                    <span className="text-[#C5C6C7] opacity-40">—</span>
                  )}
                </div>
              </td>
              <td className="py-3 text-center">
                <Badge variant={win.status === "completed" ? "healthy" : "neutral"}>
                  {win.status ?? "scheduled"}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
