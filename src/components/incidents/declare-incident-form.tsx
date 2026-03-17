"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Severity = "sev1" | "sev2" | "sev3" | "sev4";
type TenantScope = "all" | "specific";

interface DeclareIncidentFormProps {
  onSuccess?: (incidentId: string) => void;
}

const severityLabels: Record<Severity, string> = {
  sev1: "SEV1 — Critical",
  sev2: "SEV2 — High",
  sev3: "SEV3 — Medium",
  sev4: "SEV4 — Low",
};

const severityColors: Record<Severity, string> = {
  sev1: "border-red-500 bg-red-500/10 text-red-400",
  sev2: "border-amber-500 bg-amber-500/10 text-amber-400",
  sev3: "border-yellow-500 bg-yellow-500/10 text-yellow-400",
  sev4: "border-[#384656] bg-[#384656]/20 text-[#C5C6C7]",
};

const severitySelectedColors: Record<Severity, string> = {
  sev1: "border-red-500 bg-red-500/20 ring-1 ring-red-500",
  sev2: "border-amber-500 bg-amber-500/20 ring-1 ring-amber-500",
  sev3: "border-yellow-500 bg-yellow-500/20 ring-1 ring-yellow-500",
  sev4: "border-[#66FCF1] bg-[#66FCF1]/10 ring-1 ring-[#66FCF1]",
};

export function DeclareIncidentForm({ onSuccess }: DeclareIncidentFormProps) {
  const [title, setTitle] = React.useState("");
  const [severity, setSeverity] = React.useState<Severity>("sev2");
  const [rootSubsystem, setRootSubsystem] = React.useState("");
  const [impactedComponents, setImpactedComponents] = React.useState("");
  const [tenantScope, setTenantScope] = React.useState<TenantScope>("all");
  const [submitted, setSubmitted] = React.useState(false);
  const [generatedId, setGeneratedId] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const severities: Severity[] = ["sev1", "sev2", "sev3", "sev4"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 500));
    const id = `INC-${Date.now().toString(36).toUpperCase()}`;
    setGeneratedId(id);
    setSubmitted(true);
    setIsSubmitting(false);
    onSuccess?.(id);
  }

  if (submitted) {
    return (
      <div className="rounded border border-[#45A29E]/40 bg-[#45A29E]/10 p-6">
        <div className="flex items-start gap-4">
          <CheckCircle className="mt-0.5 h-6 w-6 shrink-0 text-[#45A29E]" />
          <div className="space-y-3">
            <h3 className="font-mono text-sm font-medium text-[#45A29E]">
              Incident Declared
            </h3>
            <div className="space-y-1.5 font-mono text-xs text-[#C5C6C7]">
              <div>
                <span className="opacity-50">Incident ID: </span>
                <span className="font-bold text-[#66FCF1]">{generatedId}</span>
              </div>
              <div>
                <span className="opacity-50">Title: </span>
                <span>{title}</span>
              </div>
              <div>
                <span className="opacity-50">Severity: </span>
                <span className="uppercase">{severity}</span>
              </div>
              {rootSubsystem && (
                <div>
                  <span className="opacity-50">Root Subsystem: </span>
                  <span>{rootSubsystem}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <label className="font-mono text-xs uppercase tracking-wider text-[#C5C6C7] opacity-60">
          Incident Title <span className="text-red-400">*</span>
        </label>
        <Input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief description of the incident"
          className="font-mono text-sm"
        />
      </div>

      {/* Severity */}
      <div className="space-y-2">
        <label className="font-mono text-xs uppercase tracking-wider text-[#C5C6C7] opacity-60">
          Severity <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {severities.map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setSeverity(sev)}
              className={cn(
                "rounded border p-3 text-left transition-all",
                severity === sev ? severitySelectedColors[sev] : severityColors[sev],
                "hover:opacity-90"
              )}
            >
              <div className="flex items-center gap-2">
                {severity === sev && <AlertTriangle className="h-3 w-3 shrink-0" />}
                <span className="font-mono text-xs">{severityLabels[sev]}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Root Subsystem */}
      <div className="space-y-2">
        <label className="font-mono text-xs uppercase tracking-wider text-[#C5C6C7] opacity-60">
          Root Subsystem
        </label>
        <Input
          value={rootSubsystem}
          onChange={(e) => setRootSubsystem(e.target.value)}
          placeholder="e.g., api-gateway, database, worker-queue"
          className="font-mono text-sm"
        />
      </div>

      {/* Impacted Components */}
      <div className="space-y-2">
        <label className="font-mono text-xs uppercase tracking-wider text-[#C5C6C7] opacity-60">
          Impacted Components
          <span className="ml-2 opacity-50">(comma-separated)</span>
        </label>
        <Input
          value={impactedComponents}
          onChange={(e) => setImpactedComponents(e.target.value)}
          placeholder="e.g., auth-service, billing, notifications"
          className="font-mono text-sm"
        />
      </div>

      {/* Tenant Scope */}
      <div className="space-y-2">
        <label className="font-mono text-xs uppercase tracking-wider text-[#C5C6C7] opacity-60">
          Tenant Scope
        </label>
        <div className="flex gap-3">
          {(["all", "specific"] as TenantScope[]).map((scope) => (
            <button
              key={scope}
              type="button"
              onClick={() => setTenantScope(scope)}
              className={cn(
                "rounded border px-4 py-2 font-mono text-sm capitalize transition-colors",
                tenantScope === scope
                  ? "border-[#66FCF1] bg-[#66FCF1]/10 text-[#66FCF1]"
                  : "border-[#384656] text-[#C5C6C7] hover:border-[#66FCF1]/50"
              )}
            >
              {scope === "all" ? "All Tenants" : "Specific Tenants"}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          disabled={!title || isSubmitting}
          className="gap-2 font-mono"
        >
          {isSubmitting ? "Declaring..." : "Declare Incident"}
        </Button>
      </div>
    </form>
  );
}
