"use client";

import { getReadinessLabel } from "@/lib/onboarding/experience";
import { useOnboardingState } from "@/lib/onboarding/store";
import { clearStoredActivationSession } from "@/lib/activation/session";
import { useTenantContext } from "@/lib/control-plane/tenant-context";
import { useTenantBinding } from "@/lib/control-plane/tenant-binding";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { Activity, Menu, User } from "lucide-react";
import * as React from "react";

interface TopBarProps {
  onToggleSidebar?: () => void;
  className?: string;
}

const FIRST_RUN_ROUTES = new Set(["/", "/get-started", "/welcome", "/setup", "/onboarding"]);

export function TopBar({ onToggleSidebar, className }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isOnboardingRoute = FIRST_RUN_ROUTES.has(pathname);
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const { me } = useTenantContext();
  const { confirmedTenant, isConfirmed, isTestMode } = useTenantBinding();
  const { state, resetOnboarding } = useOnboardingState();

  const handleSignOut = React.useCallback(() => {
    resetOnboarding();
    clearStoredActivationSession();
    window.localStorage.clear();
    router.push("/");
  }, [resetOnboarding, router]);

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

  return (
    <header
      className={cn(
        "flex h-16 items-center justify-between border-b border-[#384656] bg-[#1F2833] px-6",
        className
      )}
    >
      <div className="flex items-center gap-4">
        {!isOnboardingRoute && onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="flex items-center justify-center rounded p-2 text-[#C5C6C7] transition-colors hover:bg-[#384656] hover:text-[#66FCF1]"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <div className="flex items-center gap-2">
          <Image src="/images/keon-control-logo.png" alt="Keon Control" width={64} height={32} className="h-8 w-auto" />
          <div>
            <h1 className="font-['Rajdhani'] text-xl font-bold tracking-wide text-[#C5C6C7]">KEON CONTROL</h1>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#66FCF1] opacity-70">
              {isOnboardingRoute ? "Workspace setup" : "AI activity control plane"}
            </div>
          </div>
        </div>
      </div>

      {!isOnboardingRoute && (
        <div className="hidden items-center gap-3 xl:flex">
          {isTestMode && (
            <div className="rounded border border-[#F4D35E]/40 bg-[#F4D35E]/12 px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[#F4D35E]">
              Test activation mode
            </div>
          )}
          <div className="flex items-center gap-2 rounded border border-[#384656] bg-[#0B0C10] px-4 py-2">
            <span className="font-mono text-xs uppercase tracking-wider text-[#C5C6C7]">
              Member: {me?.userId ?? "Loading"}
            </span>
            <span className="font-mono text-xs uppercase tracking-wider text-[#384656]">|</span>
            <span className="font-mono text-xs uppercase tracking-wider text-[#66FCF1]">
              Workspace: {isConfirmed ? confirmedTenant?.name ?? "Confirmed" : "Setup in progress"}
            </span>
          </div>

          {me?.operatorModeEnabled && (
            <div
              className="flex items-center gap-2 rounded border border-[#384656] bg-[#0B0C10] px-3 py-2 text-[#C5C6C7]"
              title="Advanced mode is enabled by your workspace administrator"
            >
              <Activity className="h-4 w-4 text-[#66FCF1]" />
              <span className="font-mono text-xs text-[#66FCF1]">Advanced mode</span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-4">
        {isOnboardingRoute && (
          <div className="hidden rounded border border-[#384656] bg-[#0B0C10] px-3 py-2 md:block">
            <span className="font-mono text-xs text-[#C5C6C7]">
              {isConfirmed ? `${getReadinessLabel(state)} for ${confirmedTenant?.name ?? "your workspace"}` : getReadinessLabel(state)}
            </span>
          </div>
        )}
        <time className="font-mono text-sm tabular-nums text-[#C5C6C7]" suppressHydrationWarning>
          {formatTime(currentTime)}
        </time>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 rounded border border-[#384656] bg-[#0B0C10] px-3 py-2 text-[#C5C6C7] transition-colors hover:border-[#66FCF1] hover:text-[#66FCF1]"
              aria-label="User menu"
            >
              <User className="h-4 w-4" />
              <span className="font-mono text-xs">Account</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="z-50 mt-2 min-w-[220px] rounded border border-[#384656] bg-[#1F2833] p-1 shadow-lg"
          >
            <DropdownMenuLabel className="px-3 py-2 font-mono text-xs text-[#66FCF1]">
              {confirmedTenant?.name ?? me?.tenantName ?? "Workspace access"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1 h-px bg-[#384656]" />
            <DropdownMenuItem asChild className="cursor-pointer rounded px-3 py-2 font-mono text-sm text-[#C5C6C7] outline-none hover:bg-[#384656] hover:text-[#66FCF1] focus:bg-[#384656] focus:text-[#66FCF1]">
              <Link href="/settings">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer rounded px-3 py-2 font-mono text-sm text-[#C5C6C7] outline-none hover:bg-[#384656] hover:text-[#66FCF1] focus:bg-[#384656] focus:text-[#66FCF1]">
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 h-px bg-[#384656]" />
            <DropdownMenuItem
              className="cursor-pointer rounded px-3 py-2 font-mono text-sm text-[#C5C6C7] outline-none hover:bg-[#384656] hover:text-[#66FCF1] focus:bg-[#384656] focus:text-[#66FCF1]"
              onSelect={handleSignOut}
            >
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
