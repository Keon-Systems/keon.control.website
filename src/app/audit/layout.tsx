import * as React from "react";
import { Shell } from "@/components/layout";

export default function AuditLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
