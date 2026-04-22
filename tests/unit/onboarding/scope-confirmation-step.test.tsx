import { ScopeConfirmationStep } from "@/components/onboarding/steps/scope-confirmation-step";
import type { Tenant } from "@/lib/api/types";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseTenantBinding = vi.fn();
const mockUseOnboardingState = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

vi.mock("@/lib/control-plane/tenant-binding", () => ({
  useTenantBinding: () => mockUseTenantBinding(),
}));

vi.mock("@/lib/onboarding/store", () => ({
  useOnboardingState: () => mockUseOnboardingState(),
}));

const tenant: Tenant = {
  id: "tenant_1",
  name: "Acme Workspace",
  status: "active",
  createdAt: "2026-03-27T14:00:12.000Z",
};

function buildTenantBinding(overrides: Partial<ReturnType<typeof mockUseTenantBinding>> = {}) {
  return {
    tenants: [tenant],
    isLoading: false,
    isError: false,
    retry: vi.fn(),
    selectedTenantId: tenant.id,
    selectTenant: vi.fn(),
    environment: "sandbox",
    setEnvironment: vi.fn(),
    confirmBinding: vi.fn(),
    isTestMode: false,
    ...overrides,
  };
}

beforeEach(() => {
  vi.useRealTimers();
  mockReplace.mockReset();
  mockUseOnboardingState.mockReturnValue({
    confirmAccess: vi.fn(),
  });
});

describe("ScopeConfirmationStep", () => {
  it("does not render 'Confirm and continue' during recoverable failure", () => {
    const tenantBinding = buildTenantBinding({
      tenants: [],
      isError: true,
    });

    mockUseTenantBinding.mockReturnValue(tenantBinding);

    render(<ScopeConfirmationStep />);

    expect(screen.queryByRole("button", { name: /confirm and continue/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    expect(screen.getByText(/you can continue once your workspace is available/i)).toBeInTheDocument();
  });

  it("renders the environment selector when the workspace is ready", () => {
    mockUseTenantBinding.mockReturnValue(buildTenantBinding());

    render(<ScopeConfirmationStep />);

    expect(screen.getByRole("button", { name: /confirm and continue/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sandbox/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /production/i })).toBeInTheDocument();
  });

  it("retry can recover into a ready state", async () => {
    const recoveredBinding = buildTenantBinding();
    const retry = vi.fn();

    mockUseTenantBinding
      .mockReturnValueOnce(
        buildTenantBinding({
          tenants: [],
          isError: true,
          retry,
          selectedTenantId: null,
        })
      )
      .mockReturnValue(recoveredBinding);

    const user = userEvent.setup();
    const { rerender } = render(<ScopeConfirmationStep />);

    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(retry).toHaveBeenCalledTimes(1);

    rerender(<ScopeConfirmationStep />);

    expect(await screen.findByRole("button", { name: /confirm and continue/i })).toBeInTheDocument();
  });

  it("only advances after confirmation from the ready state", async () => {
    const confirmBinding = vi.fn();
    const confirmAccess = vi.fn();

    mockUseTenantBinding.mockReturnValue(buildTenantBinding({ confirmBinding }));
    mockUseOnboardingState.mockReturnValue({ confirmAccess });

    const user = userEvent.setup();
    render(<ScopeConfirmationStep />);

    expect(confirmBinding).not.toHaveBeenCalled();
    expect(confirmAccess).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /confirm and continue/i }));

    expect(screen.queryByRole("button", { name: /confirm and continue/i })).not.toBeInTheDocument();
    expect(screen.getByText(/workspace confirmed/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(confirmBinding).toHaveBeenCalledTimes(1);
      expect(confirmAccess).toHaveBeenCalledWith(tenant.id);
      expect(mockReplace).toHaveBeenCalledWith("/setup?step=integration");
    }, { timeout: 1500 });
  });

  it("labels the onboarding step when test activation mode is active", () => {
    mockUseTenantBinding.mockReturnValue(buildTenantBinding({ isTestMode: true }));

    render(<ScopeConfirmationStep />);

    expect(screen.getByText(/test activation mode/i)).toBeInTheDocument();
    expect(
      screen.getByText(/pinned to the keon internal test workspace in sandbox/i)
    ).toBeInTheDocument();
  });
});
