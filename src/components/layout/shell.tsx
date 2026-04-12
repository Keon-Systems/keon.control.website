"use client";

import { NextStepCard } from "@/components/control-plane";
import { IncidentShell } from "@/components/incident";
import { AppReadyGate } from "@/components/onboarding/route-gates";
import { useIncidentMode } from "@/lib/incident-mode";
import { useIncidentTrigger } from "@/lib/use-incident-trigger";
import { BARE_ROUTES } from "@/lib/layout/bare-routes";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import * as React from "react";
import { CommandPalette } from "./command-palette";
import { Sidebar } from "./sidebar";
import { TopBar } from "./topbar";

interface ShellProps {
  children: React.ReactNode;
  className?: string;
}

const FIRST_RUN_ROUTES = new Set([
  "/",
  "/get-started",
  "/welcome",
  "/setup",
  "/onboarding",
]);

export function Shell({ children, className }: ShellProps) {
  const pathname = usePathname();
  const isBareRoute = BARE_ROUTES.has(pathname);
  const isOnboardingRoute = !isBareRoute && FIRST_RUN_ROUTES.has(pathname);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(isOnboardingRoute);
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const { state } = useIncidentMode();

  useIncidentTrigger();

  React.useEffect(() => {
    setSidebarCollapsed(isOnboardingRoute);
  }, [isOnboardingRoute]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }

      if (!isOnboardingRoute && (e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setSidebarCollapsed((prev) => !prev);
      }

      if (e.key === "Escape") {
        setCommandPaletteOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOnboardingRoute]);

  if (isBareRoute) {
    return <>{children}</>;
  }

  if (state.active) {
    return <IncidentShell>{children}</IncidentShell>;
  }

  const shellContent = (
    <div className={cn("relative flex h-screen w-full flex-col bg-[#0B0C10]", className)}>
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
      <TopBar onToggleSidebar={isOnboardingRoute ? undefined : () => setSidebarCollapsed((prev) => !prev)} />

      <div className="flex flex-1 overflow-hidden">
        {!isOnboardingRoute && <Sidebar collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} />}

        <main
          className={cn(
            "relative flex-1 overflow-y-auto transition-all duration-300",
            !isOnboardingRoute && (sidebarCollapsed ? "ml-16" : "ml-72")
          )}
        >
          {!isOnboardingRoute && (
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#384656_1px,transparent_1px),linear-gradient(to_bottom,#384656_1px,transparent_1px)] bg-[size:24px_24px] opacity-[0.02]" />
          )}
          <div className={cn("relative z-10", isOnboardingRoute ? "px-4 py-8 sm:px-6 lg:px-10" : "space-y-4 p-4")}>
            {!isOnboardingRoute && <NextStepCard />}
            <div>{children}</div>
          </div>
        </main>
      </div>
    </div>
  );

  if (isOnboardingRoute) {
    return shellContent;
  }

  return <AppReadyGate>{shellContent}</AppReadyGate>;
}
