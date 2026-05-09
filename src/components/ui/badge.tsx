import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

/**
 * Badge variants for Keon Command Center
 * Design: Status indicators with minimal fills, thin borders, tactical glow
 */
const badgeVariants = cva(
  [
    "inline-flex items-center gap-1.5",
    "shrink-0 whitespace-nowrap px-2.5 py-1",
    "font-mono text-[11px] uppercase leading-none tracking-[0.08em] sm:text-xs sm:tracking-wide",
    "border rounded-sm", // 2px max
    "transition-all duration-75",
  ].join(" "),
  {
    variants: {
      variant: {
        healthy: [
          "bg-transparent text-[--reactor-blue]",
          "border-[--reactor-blue]",
          "shadow-[0_0_4px_rgba(69,162,158,0.3)]",
        ].join(" "),
        warning: [
          "bg-transparent text-[--safety-orange]",
          "border-[--safety-orange]",
          "shadow-[0_0_4px_rgba(255,107,0,0.3)]",
        ].join(" "),
      critical: [
          "bg-[--ballistic-red] text-[--flash]",
          "border-[--ballistic-red]",
          "shadow-[0_0_6px_rgba(255,46,46,0.4)]",
        ].join(" "),
      neutral: [
        "bg-transparent text-[--steel]",
        "border-[--steel]",
      ].join(" "),
      default: [
        "bg-transparent text-[--steel]",
        "border-[--steel]",
      ].join(" "),
      offline: [
          "bg-transparent text-[--tungsten]",
          "border-[--tungsten]",
          "opacity-60",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Badge Component - Status Indicator
 *
 * Variants:
 * - healthy: Reactor blue, operational status
 * - warning: Safety orange, attention required
 * - critical: Ballistic red with fill, immediate action
 * - neutral: Steel gray, informational
 * - offline: Tungsten, inactive state
 *
 * @example
 * <Badge variant="healthy">ONLINE</Badge>
 * <Badge variant="critical">ALERT</Badge>
 */
const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
