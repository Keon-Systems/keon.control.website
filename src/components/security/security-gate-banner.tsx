"use client";
import * as React from "react";
import { ShieldOff } from "lucide-react";

export function SecurityGateBanner({ children }: { children: React.ReactNode }) {
  const gateEnabled = process.env.NEXT_PUBLIC_SECURITY_GATE_ENABLED === "true";
  if (gateEnabled) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <ShieldOff className="mb-4 h-12 w-12 text-[#384656]" />
        <p className="font-mono text-sm text-[#C5C6C7] opacity-50">Security access requires elevated privilege</p>
        <p className="font-mono text-xs text-[#C5C6C7] opacity-30 mt-1">Actor: ops-hardcoded@keon.systems</p>
      </div>
    );
  }
  return <>{children}</>;
}
