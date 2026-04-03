"use client";

import { Card, CardContent, CardHeader } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOnboardingPreferences, type OnboardingRoleHint, type OnboardingTrack } from "@/lib/control-plane/onboarding-preferences";
import { cn } from "@/lib/utils";

const trackDefinitions: { id: OnboardingTrack; title: string; description: string }[] = [
  {
    id: "governed-execution",
    title: "Govern AI actions",
    description: "Confirm workspace scope, set the right guardrails, and review the first governed action with receipts.",
  },
  {
    id: "memory-context",
    title: "Connect memory and context",
    description: "Define how context is carried forward, what stays bounded, and how memory-backed workflows should begin.",
  },
  {
    id: "collective-oversight",
    title: "Enable collective oversight",
    description: "Set up deliberation and approval paths for teams that need multi-party governance and review.",
  },
];

const roleDefinitions: { id: OnboardingRoleHint; title: string; description: string }[] = [
  {
    id: "organization",
    title: "I’m setting this up for my organization",
    description: "Best when you are preparing a shared workspace, policies, and oversight for a team.",
  },
  {
    id: "builder",
    title: "I’m integrating this into products or workflows",
    description: "Best when you also need technical setup after the guided workspace onboarding is complete.",
  },
];

export function SetupPathCard({
  title = "Choose what you want to enable first",
  description = "Pick one or more setup paths and Keon will build your onboarding checklist automatically.",
  compact = false,
}: {
  title?: string;
  description?: string;
  compact?: boolean;
}) {
  const { selectedTracks, roleHint, hasPreferences, toggleTrack, setRoleHint, clearPreferences } = useOnboardingPreferences();

  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardContent className={cn("space-y-5", compact && "space-y-4")}>
        <div className="space-y-2">
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-[#66FCF1]">How you’re approaching setup</div>
          <div className="grid gap-2 lg:grid-cols-2">
            {roleDefinitions.map((role) => {
              const active = roleHint === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setRoleHint(role.id)}
                  className={cn(
                    "rounded border p-4 text-left transition-colors",
                    active
                      ? "border-[#66FCF1] bg-[#66FCF1]/8"
                      : "border-[#384656] bg-[#0B0C10] hover:border-[#66FCF1]/40"
                  )}
                >
                  <div className="font-['Rajdhani'] text-lg font-semibold text-[#C5C6C7]">{role.title}</div>
                  <p className="mt-2 font-mono text-xs leading-5 text-[#C5C6C7] opacity-75">{role.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-[#66FCF1]">Setup paths</div>
          <div className="grid gap-3 lg:grid-cols-3">
            {trackDefinitions.map((track) => {
              const active = selectedTracks.includes(track.id);
              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => toggleTrack(track.id)}
                  className={cn(
                    "rounded border p-5 text-left transition-colors",
                    active
                      ? "border-[#66FCF1] bg-[#66FCF1]/8"
                      : "border-[#384656] bg-[#0B0C10] hover:border-[#66FCF1]/40"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-['Rajdhani'] text-xl font-semibold text-[#C5C6C7]">{track.title}</div>
                    {active && <Badge variant="healthy">Selected</Badge>}
                  </div>
                  <p className="mt-3 font-mono text-sm leading-6 text-[#C5C6C7] opacity-80">{track.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {hasPreferences && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded border border-[#384656] bg-[#0B0C10] p-4">
            <p className="font-mono text-sm leading-6 text-[#C5C6C7] opacity-80">
              Your selections now shape the checklist below. You can change them later if your rollout priorities shift.
            </p>
            <Button variant="outline" size="sm" onClick={clearPreferences}>Reset setup choices</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
