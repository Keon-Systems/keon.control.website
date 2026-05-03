import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import IntegrationsPage from "@/app/integrations/page";

vi.mock("@/components/layout", () => ({
  Shell: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/layout/page-container", () => ({
  PageContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PageHeader: ({ title, description }: { title: ReactNode; description?: ReactNode }) => (
    <div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  ),
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardHeader: ({ title, description }: { title: ReactNode; description?: ReactNode }) => (
    <div>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  ),
  CardContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/control-plane", () => ({
  TenantScopeGuard: () => null,
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children }: { children: ReactNode; [key: string]: unknown }) => (
    <button>{children}</button>
  ),
}));

vi.mock("next/link", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/api/control-plane", () => ({
  getBillingSummary: vi.fn().mockResolvedValue(null),
  listApiKeys: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/control-plane/tenant-binding", () => ({
  useTenantBinding: () => ({
    isConfirmed: true,
    isTestMode: true,
    confirmedTenant: {
      id: "ten_keon_internal_test",
      name: "Keon Internal Test Workspace",
      status: "active",
      createdAt: "",
    },
    confirmedEnvironment: "sandbox",
  }),
}));

describe("IntegrationsPage — test mode", () => {
  it("shows deterministic sandbox plan label instead of Loading", async () => {
    render(<IntegrationsPage />);
    expect(await screen.findByText(/sandbox preview/i)).toBeInTheDocument();
    expect(screen.queryByText(/Plan: Loading/)).not.toBeInTheDocument();
  });

  it("shows deterministic billing label instead of Loading", async () => {
    render(<IntegrationsPage />);
    expect(await screen.findByText(/included during preview/i)).toBeInTheDocument();
    expect(screen.queryByText(/Billing state: Loading/)).not.toBeInTheDocument();
  });

  it("renders environment-aware copy without 'real traffic' in test mode", async () => {
    render(<IntegrationsPage />);
    await screen.findByText(/sandbox preview/i); // wait for render to settle
    expect(screen.queryByText(/real traffic/i)).not.toBeInTheDocument();
    expect(screen.getByText(/ai actions/i)).toBeInTheDocument();
  });
});
