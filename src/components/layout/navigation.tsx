"use client";

import {
  Activity,
  BookOpen,
  Home,
  KeyRound,
  Settings,
  ShieldCheck,
  Waves,
} from "lucide-react";
import type * as React from "react";

export interface NavigationItem {
  label: string;
  href: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

export const navigationSections: NavigationSection[] = [
  {
    title: "Prepare",
    items: [
      {
        label: "Setup",
        href: "/setup",
        description: "Configure goals, workspace, integration model, and guardrails.",
        icon: ShieldCheck,
      },
      {
        label: "Guardrails",
        href: "/policies",
        description: "Edit approval and review rules.",
        icon: ShieldCheck,
      },
    ],
  },
  {
    title: "Connect",
    items: [
      {
        label: "Integrations",
        href: "/integrations",
        description: "Connect runtimes and issue API keys.",
        icon: Waves,
      },
    ],
  },
  {
    title: "Verify",
    items: [
      {
        label: "Receipts",
        href: "/receipts",
        description: "Review the evidence trail for governed actions.",
        icon: KeyRound,
      },
    ],
  },
  {
    title: "Operate",
    items: [
      {
        label: "Workspace",
        href: "/control",
        description: "Operational execution state and active requests.",
        icon: Home,
      },
      {
        label: "Reviews",
        href: "/collective",
        description: "Collaborative review for high-risk decisions.",
        icon: BookOpen,
      },
    ],
  },
  {
    title: "Advanced",
    items: [
      {
        label: "Diagnostics",
        href: "/cockpit",
        description: "Advanced system inspection after setup is complete.",
        icon: Activity,
        badge: "Advanced",
      },
      {
        label: "Settings",
        href: "/settings",
        description: "Workspace, access, and notification settings.",
        icon: Settings,
      },
      {
        label: "API Keys",
        href: "/api-keys",
        description: "Manage credentials for connected integrations.",
        icon: KeyRound,
      },
    ],
  },
];

export const navigationItems = navigationSections.flatMap((section) => section.items);
