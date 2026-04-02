import * as React from "react";
import { Shell } from "@/components/layout";

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
