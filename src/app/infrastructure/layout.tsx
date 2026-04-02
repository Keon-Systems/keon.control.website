import * as React from "react";
import { Shell } from "@/components/layout";

export default function InfrastructureLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
