import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";

export default function OnboardingRouteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <OnboardingLayout>{children}</OnboardingLayout>;
}
