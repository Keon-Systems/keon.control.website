"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Channel = "email" | "in-app" | "status-page";

interface IncidentCommsPanelProps {
  incidentId: string;
}

const channelLabels: Record<Channel, string> = {
  email: "Email",
  "in-app": "In-App",
  "status-page": "Status Page",
};

export function IncidentCommsPanel({ incidentId }: IncidentCommsPanelProps) {
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [channel, setChannel] = React.useState<Channel>("email");
  const [sent, setSent] = React.useState(false);
  const [sentId, setSentId] = React.useState<string>("");

  const channels: Channel[] = ["email", "in-app", "status-page"];

  function handleSend() {
    const notifId = `notif-${Date.now().toString(36)}`;
    setSentId(notifId);
    setSent(true);
  }

  function handleReset() {
    setSubject("");
    setBody("");
    setChannel("email");
    setSent(false);
    setSentId("");
  }

  if (sent) {
    return (
      <div className="rounded border border-[#45A29E]/40 bg-[#45A29E]/10 p-6">
        <div className="flex items-start gap-4">
          <CheckCircle className="mt-0.5 h-6 w-6 shrink-0 text-[#45A29E]" />
          <div className="space-y-2">
            <h3 className="font-mono text-sm font-medium text-[#45A29E]">
              Notification Sent
            </h3>
            <div className="space-y-1 font-mono text-xs text-[#C5C6C7] opacity-70">
              <div>
                <span className="opacity-50">Notification ID: </span>
                <span>{sentId}</span>
              </div>
              <div>
                <span className="opacity-50">Incident: </span>
                <span>{incidentId}</span>
              </div>
              <div>
                <span className="opacity-50">Channel: </span>
                <span className="uppercase">{channel}</span>
              </div>
              <div>
                <span className="opacity-50">Subject: </span>
                <span>{subject || "(no subject)"}</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="mt-3 font-mono text-xs"
            >
              Send Another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Channel Selector */}
      <div className="space-y-2">
        <label className="font-mono text-xs uppercase tracking-wider text-[#C5C6C7] opacity-60">
          Channel
        </label>
        <div className="flex gap-2">
          {channels.map((ch) => (
            <button
              key={ch}
              onClick={() => setChannel(ch)}
              className={cn(
                "rounded border px-3 py-1.5 font-mono text-xs transition-colors",
                channel === ch
                  ? "border-[#66FCF1] bg-[#66FCF1]/10 text-[#66FCF1]"
                  : "border-[#384656] text-[#C5C6C7] hover:border-[#66FCF1]/50"
              )}
            >
              {channelLabels[ch]}
            </button>
          ))}
        </div>
      </div>

      {/* Subject */}
      <div className="space-y-2">
        <label className="font-mono text-xs uppercase tracking-wider text-[#C5C6C7] opacity-60">
          Subject
        </label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Incident Update: [Title]"
          className="font-mono text-sm"
        />
      </div>

      {/* Message Body */}
      <div className="space-y-2">
        <label className="font-mono text-xs uppercase tracking-wider text-[#C5C6C7] opacity-60">
          Message
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Describe the incident status, impact, and next steps..."
          rows={6}
          className="w-full rounded border border-[#384656] bg-[#0B0C10] px-3 py-2 font-mono text-sm text-[#C5C6C7] placeholder-[#C5C6C7]/30 outline-none focus:border-[#66FCF1]/50 focus:ring-0"
        />
      </div>

      {/* Preview */}
      {(subject || body) && (
        <div className="rounded border border-[#384656] bg-[#0B0C10] p-4">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[#C5C6C7] opacity-50">
            Preview — {channelLabels[channel]}
          </div>
          {subject && (
            <div className="mb-2 font-mono text-sm font-medium text-[#C5C6C7]">{subject}</div>
          )}
          {body && (
            <div className="whitespace-pre-wrap font-mono text-xs text-[#C5C6C7] opacity-70">
              {body}
            </div>
          )}
        </div>
      )}

      {/* Send Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSend}
          disabled={!subject && !body}
          className="gap-2 font-mono"
        >
          <Send className="h-4 w-4" />
          Send Notification
        </Button>
      </div>
    </div>
  );
}
