"use client";

import { cn } from "@/lib/utils";
import {
    BookOpen,
    ChevronLeft,
    CreditCard,
    Gavel,
    KeyRound,
    LayoutDashboard,
    MessageSquare,
    Scale,
    Settings,
    Sparkles,
    Users,
    Waves
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

interface SidebarProps {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  className?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    items: [
      { label: "Overview", href: "/", icon: LayoutDashboard },
      { label: "Get Started", href: "/get-started", icon: Sparkles },
      { label: "Usage", href: "/usage", icon: Waves },
      { label: "API Keys", href: "/api-keys", icon: KeyRound },
      { label: "Subscription", href: "/admin/subscription", icon: CreditCard },
      { label: "Tenant", href: "/tenants", icon: Users },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
  {
    title: "Collective",
    items: [
      { label: "Overview", href: "/collective", icon: BookOpen },
      { label: "Deliberations", href: "/collective/deliberations", icon: MessageSquare },
      { label: "Reforms", href: "/collective/reforms", icon: Gavel },
      { label: "Legitimacy", href: "/collective/legitimacy", icon: Scale },
    ],
  },
];

// Flat list for keyboard navigation
const navItems: NavItem[] = navSections.flatMap((s) => s.items);

export function Sidebar({ collapsed = false, onCollapse, className }: SidebarProps) {
  const pathname = usePathname();
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  // Keyboard navigation (J/K keys)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not in an input field
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "j") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % navItems.length);
      } else if (e.key === "k") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + navItems.length) % navItems.length);
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        const item = navItems[selectedIndex];
        if (item) {
          window.location.href = item.href;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex]);

  // Update selected index based on pathname
  React.useEffect(() => {
    const index = navItems.findIndex((item) => item.href === pathname);
    if (index !== -1) {
      setSelectedIndex(index);
    }
  }, [pathname]);

  // Save collapsed state to localStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar-collapsed", JSON.stringify(collapsed));
    }
  }, [collapsed]);

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 z-40 flex h-[calc(100vh-4rem)] flex-col border-r border-[#384656] bg-[#1F2833] transition-all duration-300",
        collapsed ? "w-16" : "w-60",
        className
      )}
    >
      {/* Navigation Items */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navSections.map((section, sectionIdx) => {
          // Calculate the global index offset for this section
          let globalOffset = 0;
          for (let i = 0; i < sectionIdx; i++) {
            globalOffset += navSections[i].items.length;
          }

          return (
            <div key={section.title ?? sectionIdx} className={cn(sectionIdx > 0 && "mt-4")}>
              {section.title && !collapsed && (
                <div className="mb-2 px-3 font-mono text-[10px] uppercase tracking-widest text-[#66FCF1] opacity-60">
                  {section.title}
                </div>
              )}
              {sectionIdx > 0 && (
                <div className="mb-2 border-t border-[#384656]" />
              )}
              {section.items.map((item, itemIdx) => {
                const globalIndex = globalOffset + itemIdx;
                const Icon = item.icon;
                const isActive = pathname === item.href;
                const isSelected = globalIndex === selectedIndex;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded px-3 py-2.5 transition-all",
                      "text-[#C5C6C7] hover:bg-[#384656] hover:text-[#66FCF1]",
                      isActive && "border-l-2 border-[#66FCF1] bg-[#384656] text-[#66FCF1]",
                      isSelected && !isActive && "ring-1 ring-[#66FCF1] ring-opacity-50"
                    )}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                  >
                    {/* Active indicator glow */}
                    {isActive && (
                      <div className="absolute inset-0 rounded bg-[#66FCF1] opacity-5"></div>
                    )}

                    {/* Icon */}
                    <Icon
                      className={cn(
                        "h-5 w-5 shrink-0 transition-colors",
                        isActive && "text-[#66FCF1]"
                      )}
                    />

                    {/* Label */}
                    {!collapsed && (
                      <span className="font-mono text-sm font-medium">{item.label}</span>
                    )}

                    {/* Tooltip for collapsed state */}
                    {collapsed && (
                      <div className="absolute left-full top-1/2 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded border border-[#384656] bg-[#1F2833] px-3 py-2 font-mono text-sm text-[#C5C6C7] group-hover:block">
                        {section.title ? `${section.title}: ${item.label}` : item.label}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-[#384656] p-3">
        <button
          onClick={() => onCollapse?.(!collapsed)}
          className={cn(
            "flex w-full items-center gap-3 rounded px-3 py-2.5 text-[#C5C6C7] transition-all hover:bg-[#384656] hover:text-[#66FCF1]",
            collapsed && "justify-center"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            className={cn(
              "h-5 w-5 transition-transform",
              collapsed && "rotate-180"
            )}
          />
          {!collapsed && <span className="font-mono text-sm">Collapse</span>}
        </button>
      </div>

      {/* Keyboard hint */}
      {!collapsed && (
        <div className="border-t border-[#384656] p-3">
          <div className="rounded bg-[#0B0C10] p-2 text-center">
            <p className="font-mono text-xs text-[#C5C6C7] opacity-50">
              Press{" "}
              <kbd className="rounded bg-[#384656] px-1.5 py-0.5 text-[#66FCF1]">J</kbd> /{" "}
              <kbd className="rounded bg-[#384656] px-1.5 py-0.5 text-[#66FCF1]">K</kbd>{" "}
              to navigate
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
