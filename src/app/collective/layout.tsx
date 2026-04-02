import { CollectiveBanner } from "@/components/collective";
import { Shell } from "@/components/layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Collective Cognition",
  description:
    "Read-only constitutional observation surface for deliberations, reforms, and legitimacy assessments.",
};

export default function CollectiveLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Shell>
      <div className="flex min-h-[calc(100vh-4rem)] flex-col gap-6 px-6 py-6">
        <CollectiveBanner />
        {children}
      </div>
    </Shell>
  );
}
