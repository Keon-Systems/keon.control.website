"use client";

import { useTenantContext } from "@/lib/control-plane/tenant-context";
import { cn } from "@/lib/utils";
import Image from "next/image";
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

export function TopBar({ onToggleSidebar, className }: TopBarProps) {
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const { me, isLoading } = useTenantContext();

  // Update time every second
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  return (
    <header
      className={cn(
        "flex h-16 items-center justify-between border-b border-[#384656] bg-[#1F2833] px-6",
        className
      )}
    >
      {/* Left - Logo & Toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="flex items-center justify-center rounded p-2 text-[#C5C6C7] transition-colors hover:bg-[#384656] hover:text-[#66FCF1]"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <Image
            src="/keon_cyan_cube_32_37.png"
            alt="Keon"
            width={32}
            height={37}
            className="h-8 w-auto"
          />
          <h1 className="font-['Rajdhani'] text-xl font-bold tracking-wide text-[#C5C6C7]">
            KEON CONTROL
          </h1>
        </div>
      </div>

      {/* Center - Tenant / Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded border border-[#384656] bg-[#0B0C10] px-4 py-2">
          <span className="font-mono text-xs uppercase tracking-wider text-[#C5C6C7]">
            Member: {isLoading ? "Loading" : me?.userId ?? "Pending"}
          </span>
          <span className="font-mono text-xs uppercase tracking-wider text-[#384656]">|</span>
          <span className="font-mono text-xs uppercase tracking-wider text-[#66FCF1]">
            Tenant: {isLoading ? "Loading" : me?.tenantName ?? "Awaiting tenant"}
          </span>
        </div>

        <div className="flex items-center gap-2 rounded border border-[#384656] bg-[#0B0C10] px-4 py-2">
          <div className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#66FCF1] opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#66FCF1]"></span>
          </div>
            <span className="font-mono text-xs uppercase tracking-wider text-[#66FCF1]">
            Authenticated control
            </span>
          </div>

        <button className="flex items-center gap-2 rounded border border-[#384656] bg-[#0B0C10] px-3 py-2 text-[#C5C6C7] transition-colors hover:border-[#66FCF1] hover:text-[#66FCF1]">
          <Activity className="h-4 w-4" />
          <span className="font-mono text-xs">Live</span>
        </button>
      </div>

      {/* Right - Time & User */}
      <div className="flex items-center gap-4">
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
              <span className="font-mono text-xs">
                Account
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="z-50 mt-2 min-w-[200px] rounded border border-[#384656] bg-[#1F2833] p-1 shadow-lg"
          >
            <DropdownMenuLabel className="px-3 py-2 font-mono text-xs text-[#66FCF1]">
              {me?.tenantName ?? "Tenant Access"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1 h-px bg-[#384656]" />
            <DropdownMenuItem className="cursor-pointer rounded px-3 py-2 font-mono text-sm text-[#C5C6C7] outline-none hover:bg-[#384656] hover:text-[#66FCF1] focus:bg-[#384656] focus:text-[#66FCF1]">
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer rounded px-3 py-2 font-mono text-sm text-[#C5C6C7] outline-none hover:bg-[#384656] hover:text-[#66FCF1] focus:bg-[#384656] focus:text-[#66FCF1]">
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 h-px bg-[#384656]" />
            <DropdownMenuItem className="cursor-pointer rounded px-3 py-2 font-mono text-sm text-[#C5C6C7] outline-none hover:bg-[#384656] hover:text-[#66FCF1] focus:bg-[#384656] focus:text-[#66FCF1]">
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
