"use client";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, CheckCircle } from "lucide-react";

type Channel = "email" | "in-app" | "both";

interface ComposeFormProps {
  onSuccess?: (receipt: { messageId: string; enqueuedAt: string }) => void;
}

export function ComposeForm({ onSuccess }: ComposeFormProps) {
  const [recipient, setRecipient] = React.useState("all");
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [channel, setChannel] = React.useState<Channel>("email");
  const [submitting, setSubmitting] = React.useState(false);
  const [receipt, setReceipt] = React.useState<{ messageId: string; enqueuedAt: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/communications/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient, subject, body, channel }),
      });
      if (!res.ok) throw new Error("Send failed");
      const data = await res.json() as { messageId: string; enqueuedAt: string };
      setReceipt(data);
      onSuccess?.(data);
    } finally {
      setSubmitting(false);
    }
  }

  if (receipt) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle className="mb-4 h-10 w-10 text-[#66FCF1]" />
        <p className="font-mono text-sm font-medium text-[#C5C6C7]">Message Accepted</p>
        <p className="font-mono text-xs text-[#C5C6C7] opacity-60 mt-1">ID: {receipt.messageId}</p>
        <p className="font-mono text-xs text-[#C5C6C7] opacity-40 mt-0.5">
          Enqueued at {new Date(receipt.enqueuedAt).toLocaleString()}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-4"
          onClick={() => {
            setReceipt(null);
            setSubject("");
            setBody("");
          }}
        >
          Compose Another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">
          Recipients
        </label>
        <select
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          className="flex w-full px-3 py-2 bg-[#0B0C10] text-[#C5C6C7] font-mono text-sm border border-[#384656] rounded-none focus:outline-none focus:border-[#66FCF1]"
        >
          <option value="all">All Tenants</option>
          <option value="tenant-keon">Keon Systems</option>
          <option value="tenant-omega">Omega Labs</option>
          <option value="tenant-audit">Audit Sandbox</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">
          Subject
        </label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Message subject..."
          required
        />
      </div>
      <div className="space-y-2">
        <label className="font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">
          Body
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Message body..."
          required
          rows={6}
          className="flex w-full px-3 py-2 bg-[#0B0C10] text-[#C5C6C7] font-mono text-sm border border-[#384656] rounded-none focus:outline-none focus:border-[#66FCF1] resize-none"
        />
      </div>
      <div className="space-y-2">
        <label className="font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">
          Channel
        </label>
        <div className="flex gap-2">
          {(["email", "in-app", "both"] as Channel[]).map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => setChannel(ch)}
              className={`px-3 py-1 font-mono text-xs uppercase tracking-wide border rounded-none transition-all ${
                channel === ch
                  ? "bg-[#66FCF1] text-[#0B0C10] border-[#66FCF1]"
                  : "bg-transparent text-[#C5C6C7] border-[#384656] hover:border-[#66FCF1]"
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>
      <Button type="submit" disabled={submitting} className="flex items-center gap-2">
        <Send className="h-4 w-4" />
        {submitting ? "Sending..." : "Send Message"}
      </Button>
    </form>
  );
}
