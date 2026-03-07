"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Command } from "cmdk";
import { Dialog, DialogContent } from "@radix-ui/react-dialog";
import {
  DollarSign,
  Gauge,
  LayoutDashboard,
  Mail,
  ScrollText,
  Search,
  Server,
  Settings,
  ShieldAlert,
  Siren,
  Stethoscope,
  Telescope,
  Users,
} from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  keywords?: string[];
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");

  const nav = (href: string) => {
    router.push(href);
    onOpenChange(false);
  };

  // Navigation commands — matches sidebar 12 items exactly
  const navigationCommands: CommandItem[] = [
    {
      id: "fleet",
      label: "Fleet",
      description: "Operator command surface",
      icon: LayoutDashboard,
      action: () => nav("/"),
    },
    {
      id: "tenants",
      label: "Tenants",
      description: "Tenant workspace and health",
      icon: Users,
      action: () => nav("/tenants"),
    },
    {
      id: "incidents",
      label: "Incidents",
      description: "Active incident queue",
      icon: Siren,
      action: () => nav("/incidents"),
    },
    {
      id: "observability",
      label: "Observability",
      description: "SLO, jobs, traces, delivery",
      icon: Telescope,
      action: () => nav("/observability"),
    },
    {
      id: "security",
      label: "Security",
      description: "Threats, auth anomalies, abuse signals",
      icon: ShieldAlert,
      action: () => nav("/security"),
    },
    {
      id: "finance",
      label: "Finance",
      description: "Revenue, collections, Azure spend",
      icon: DollarSign,
      action: () => nav("/finance"),
    },
    {
      id: "infrastructure",
      label: "Infrastructure",
      description: "Azure resources and health",
      icon: Server,
      action: () => nav("/infrastructure"),
    },
    {
      id: "communications",
      label: "Communications",
      description: "Compose and send operator messages",
      icon: Mail,
      action: () => nav("/communications"),
    },
    {
      id: "rollouts",
      label: "Rollouts",
      description: "Feature flags, deployments, maintenance",
      icon: Gauge,
      action: () => nav("/rollouts"),
    },
    {
      id: "support",
      label: "Support",
      description: "Ticket queue and churn risk",
      icon: Stethoscope,
      action: () => nav("/support"),
    },
    {
      id: "audit",
      label: "Audit",
      description: "Privileged action log",
      icon: ScrollText,
      action: () => nav("/audit"),
    },
    {
      id: "settings",
      label: "Settings",
      description: "Operators, roles, API keys",
      icon: Settings,
      action: () => nav("/settings"),
    },
    {
      id: "tenant",
      label: "Tenant",
      description: "Tenant identity and account boundary details",
      icon: Users,
      action: () => {
        router.push("/tenants");
        onOpenChange(false);
      },
    },
  ];

  // Quick action commands
  const quickActions: CommandItem[] = [
    {
      id: "declare-incident",
      label: "Declare Incident",
      description: "Open a new incident declaration",
      icon: Siren,
      action: () => nav("/incidents/new"),
      keywords: ["new", "declare", "incident", "sev"],
    },
    {
      id: "search-tenants",
      label: "Search Tenants",
      description: "Find a tenant by name or ID",
      icon: Search,
      action: () => nav("/tenants"),
      keywords: ["find", "tenant", "search", "organization"],
    },
  ];

  const filteredNav = search
    ? navigationCommands.filter(
        (c) =>
          c.label.toLowerCase().includes(search.toLowerCase()) ||
          c.description?.toLowerCase().includes(search.toLowerCase())
      )
    : navigationCommands;

  const filteredActions = search
    ? quickActions.filter(
        (c) =>
          c.label.toLowerCase().includes(search.toLowerCase()) ||
          c.description?.toLowerCase().includes(search.toLowerCase()) ||
          c.keywords?.some((k) => k.toLowerCase().includes(search.toLowerCase()))
      )
    : quickActions;

  // Reset search when dialog closes
  React.useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent asChild>
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#0B0C10] bg-opacity-80 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Command Panel */}
          <Command
            className={cn(
              "relative z-10 w-full max-w-2xl overflow-hidden rounded border border-[#384656] bg-[#1F2833] shadow-2xl",
              "animate-in fade-in-0 zoom-in-95 slide-in-from-top-[48%]"
            )}
            shouldFilter={false}
          >
            {/* Search Input */}
            <div className="flex items-center border-b border-[#384656] px-4">
              <Search className="mr-3 h-5 w-5 shrink-0 text-[#C5C6C7] opacity-50" />
              <Command.Input
                value={search}
                onValueChange={setSearch}
                placeholder="Type a command or search..."
                className="flex h-14 w-full bg-transparent font-mono text-sm text-[#C5C6C7] placeholder-[#C5C6C7] placeholder-opacity-50 outline-none"
              />
              <kbd className="ml-auto hidden rounded bg-[#384656] px-2 py-1 font-mono text-xs text-[#66FCF1] sm:inline-block">
                ESC
              </kbd>
            </div>

            {/* Command List */}
            <Command.List className="max-h-[400px] overflow-y-auto p-2">
              {/* Empty State */}
              <Command.Empty className="flex flex-col items-center justify-center py-12">
                <Search className="mb-2 h-8 w-8 text-[#C5C6C7] opacity-30" />
                <p className="font-mono text-sm text-[#C5C6C7] opacity-50">
                  No results found
                </p>
              </Command.Empty>

              {/* Navigation Section */}
              {filteredNav.length > 0 && (
                <Command.Group
                  heading="Navigation"
                  className="mb-2 px-2 font-mono text-xs uppercase tracking-wider text-[#66FCF1]"
                >
                  {filteredNav.map((command) => {
                    const Icon = command.icon;
                    return (
                      <Command.Item
                        key={command.id}
                        value={command.label}
                        onSelect={command.action}
                        className={cn(
                          "group relative flex cursor-pointer items-center gap-3 rounded px-3 py-2.5",
                          "text-[#C5C6C7] outline-none transition-colors",
                          "hover:bg-[#384656] hover:text-[#66FCF1]",
                          "data-[selected=true]:bg-[#384656] data-[selected=true]:text-[#66FCF1]"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <div className="flex flex-1 flex-col">
                          <span className="font-mono text-sm font-medium">
                            {command.label}
                          </span>
                          {command.description && (
                            <span className="font-mono text-xs opacity-50">
                              {command.description}
                            </span>
                          )}
                        </div>
                      </Command.Item>
                    );
                  })}
                </Command.Group>
              )}

              {/* Quick Actions Section */}
              {filteredActions.length > 0 && (
                <Command.Group
                  heading="Quick Actions"
                  className="mb-2 mt-4 px-2 font-mono text-xs uppercase tracking-wider text-[#66FCF1]"
                >
                  {filteredActions.map((command) => {
                    const Icon = command.icon;
                    return (
                      <Command.Item
                        key={command.id}
                        value={`${command.label} ${command.keywords?.join(" ") || ""}`}
                        onSelect={command.action}
                        className={cn(
                          "group relative flex cursor-pointer items-center gap-3 rounded px-3 py-2.5",
                          "text-[#C5C6C7] outline-none transition-colors",
                          "hover:bg-[#384656] hover:text-[#66FCF1]",
                          "data-[selected=true]:bg-[#384656] data-[selected=true]:text-[#66FCF1]"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <div className="flex flex-1 flex-col">
                          <span className="font-mono text-sm font-medium">
                            {command.label}
                          </span>
                          {command.description && (
                            <span className="font-mono text-xs opacity-50">
                              {command.description}
                            </span>
                          )}
                        </div>
                      </Command.Item>
                    );
                  })}
                </Command.Group>
              )}
            </Command.List>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-[#384656] px-4 py-2">
              <div className="flex gap-2">
                <kbd className="rounded bg-[#384656] px-2 py-1 font-mono text-xs text-[#C5C6C7]">
                  ↑↓
                </kbd>
                <span className="font-mono text-xs text-[#C5C6C7] opacity-50">
                  Navigate
                </span>
              </div>
              <div className="flex gap-2">
                <kbd className="rounded bg-[#384656] px-2 py-1 font-mono text-xs text-[#C5C6C7]">
                  ↵
                </kbd>
                <span className="font-mono text-xs text-[#C5C6C7] opacity-50">Select</span>
              </div>
            </div>
          </Command>
        </div>
      </DialogContent>
    </Dialog>
  );
}
