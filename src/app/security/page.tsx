"use client";
import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageContainer, PageHeader, Card, CardHeader, CardContent } from "@/components/layout/page-container";
import { SecurityGateBanner } from "@/components/security";
import { AlertCircle, ShieldAlert, Eye, Ban, ShieldCheck } from "lucide-react";

type GovernanceEnvelope = { data: Record<string, unknown>[] };

export default function SecurityPage() {
  const { data, isLoading, error } = useQuery<GovernanceEnvelope>({
    queryKey: ["security", "threats"],
    queryFn: async () => {
      const res = await fetch("/api/security/threats");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    staleTime: 30_000,
  });

  const { data: authData } = useQuery<GovernanceEnvelope>({
    queryKey: ["security", "auth"],
    queryFn: async () => {
      const res = await fetch("/api/security/auth");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    staleTime: 30_000,
  });

  const threats = (data?.data ?? []) as Record<string, unknown>[];
  const anomalies = (authData?.data ?? []) as Record<string, unknown>[];

  const openThreats = threats.filter((t) => !t.resolved).length;
  const activeAnomalies = anomalies.filter((a) => !a.mitigated).length;

  const subPages = [
    {
      href: "/security/threats",
      icon: <ShieldAlert className="h-5 w-5 text-red-400" />,
      title: "Threat Signals",
      description: "Brute force, credential spray, and data exfil signals",
    },
    {
      href: "/security/auth",
      icon: <Eye className="h-5 w-5 text-amber-400" />,
      title: "Auth Anomalies",
      description: "Geo jumps, impossible travel, and session hijack detections",
    },
    {
      href: "/security/abuse",
      icon: <Ban className="h-5 w-5 text-purple-400" />,
      title: "Abuse Events",
      description: "Rate limit breaches, API scraping, and content policy violations",
    },
    {
      href: "/security/compliance",
      icon: <ShieldCheck className="h-5 w-5 text-emerald-400" />,
      title: "Compliance Posture",
      description: "SOC2, ISO 27001, and GDPR compliance checks",
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Security Operations"
        description="Threat monitoring, auth anomaly detection, and compliance posture"
      />
      <SecurityGateBanner>
        {isLoading && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded border border-[#384656] bg-[#1F2833]" />
            ))}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-red-400 mb-6">
            <AlertCircle className="h-4 w-4" />
            <span className="font-mono text-sm">Failed to load security data</span>
          </div>
        )}
        <div className="space-y-6">
          {/* Summary stats */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader
                title={
                  <span className="font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-70">
                    Open Threats
                  </span>
                }
              />
              <CardContent>
                <p className={`font-mono text-2xl font-bold ${openThreats > 0 ? "text-red-400" : "text-emerald-400"}`}>
                  {openThreats}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader
                title={
                  <span className="font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-70">
                    Active Anomalies
                  </span>
                }
              />
              <CardContent>
                <p className={`font-mono text-2xl font-bold ${activeAnomalies > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                  {activeAnomalies}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sub-page link cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {subPages.map((page) => (
              <Link key={page.href} href={page.href} className="group block">
                <Card hover>
                  <CardHeader
                    title={
                      <div className="flex items-center gap-3">
                        {page.icon}
                        <span className="font-mono text-sm text-[#C5C6C7] group-hover:text-[#66FCF1] transition-colors">
                          {page.title}
                        </span>
                      </div>
                    }
                  />
                  <CardContent>
                    <p className="font-mono text-xs text-[#C5C6C7] opacity-50">{page.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </SecurityGateBanner>
    </PageContainer>
  );
}
