import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ScopeConfirmationStep } from "@/components/onboarding/steps/scope-confirmation-step";
import type { Tenant } from "@/lib/api/types";

const mockUseTenantBinding = vi.fn();
const mockUseOnboardingState = vi.fn();

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
    confirmBinding: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.useRealTimers();
  mockUseOnboardingState.mockReturnValue({
    confirmScope: vi.fn(),
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

  it("renders 'Confirm and continue' when the workspace is ready", () => {
    mockUseTenantBinding.mockReturnValue(buildTenantBinding());

    render(<ScopeConfirmationStep />);

    expect(screen.getByRole("button", { name: /confirm and continue/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /retry/i })).not.toBeInTheDocument();
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
    vi.useFakeTimers();
    const confirmBinding = vi.fn();
    const confirmScope = vi.fn();

    mockUseTenantBinding.mockReturnValue(buildTenantBinding({ confirmBinding }));
    mockUseOnboardingState.mockReturnValue({ confirmScope });

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ScopeConfirmationStep />);

    expect(confirmBinding).not.toHaveBeenCalled();
    expect(confirmScope).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /confirm and continue/i }));

    expect(screen.queryByRole("button", { name: /confirm and continue/i })).not.toBeInTheDocument();
    expect(screen.getByText(/workspace confirmed/i)).toBeInTheDocument();
    expect(confirmBinding).not.toHaveBeenCalled();
    expect(confirmScope).not.toHaveBeenCalled();

    vi.advanceTimersByTime(450);

    await waitFor(() => {
      expect(confirmBinding).toHaveBeenCalledTimes(1);
      expect(confirmScope).toHaveBeenCalledWith(tenant.id);
    });
  });
});
