"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

/**
 * StatusIndicator variants for Keon Command Center
 * Design: LED-style status dots with glow effects
 * Pulsing animation for active/running states
 */
const statusIndicatorVariants = cva(
  [
    "inline-block rounded-full",
    "transition-all duration-75",
  ].join(" "),
  {
    variants: {
      status: {
        online: [
          "bg-[--reactor-blue]",
          "shadow-[0_0_8px_rgba(69,162,158,0.6)]",
        ].join(" "),
        running: [
          "bg-[--reactor-glow]",
          "shadow-[0_0_10px_rgba(102,252,241,0.8)]",
          "animate-pulse",
        ].join(" "),
        warning: [
          "bg-[--safety-orange]",
          "shadow-[0_0_8px_rgba(255,107,0,0.6)]",
        ].join(" "),
        critical: [
          "bg-[--ballistic-red]",
          "shadow-[0_0_10px_rgba(255,46,46,0.8)]",
          "animate-pulse",
        ].join(" "),
        offline: [
          "bg-[--tungsten]",
          "shadow-none",
          "opacity-40",
        ].join(" "),
        standby: [
          "bg-[--steel]",
          "shadow-[0_0_4px_rgba(197,198,199,0.3)]",
        ].join(" "),
      },
      size: {
        sm: "w-1.5 h-1.5",
        md: "w-2 h-2",
        lg: "w-3 h-3",
      },
    },
    defaultVariants: {
      status: "offline",
      size: "md",
    },
  }
);

export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusIndicatorVariants> {
  label?: string;
  pulse?: boolean;
}

/**
 * StatusIndicator Component - LED Status Light
 *
 * Status types:
 * - online: Reactor blue, system operational
 * - running: Reactor glow with pulse, active process
 * - warning: Safety orange, attention needed
 * - critical: Ballistic red with pulse, urgent
 * - offline: Tungsten gray, inactive
 * - standby: Steel, ready state
 *
 * @example
 * <StatusIndicator status="online" label="System" />
 * <StatusIndicator status="running" size="lg" />
 */
const StatusIndicator = React.forwardRef<
  HTMLSpanElement,
  StatusIndicatorProps
>(({ className, status, size, label, pulse, ...props }, ref) => {
  const shouldPulse = pulse || status === "running" || status === "critical";

  return (
    <span
      className={cn("inline-flex items-center gap-2", className)}
      ref={ref}
      {...props}
    >
      <span
        className={cn(
          statusIndicatorVariants({ status, size }),
          shouldPulse && "animate-pulse"
        )}
        aria-label={label ?? status ?? undefined}
      />
      {label && (
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[--steel] sm:text-xs sm:tracking-wide">
          {label}
        </span>
      )}
    </span>
  );
});
StatusIndicator.displayName = "StatusIndicator";

export { StatusIndicator, statusIndicatorVariants };
