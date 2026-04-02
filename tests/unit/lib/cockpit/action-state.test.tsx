/**
 * Keon Control — Action State Tests
 *
 * Tests the governed action lifecycle:
 *   idle → preview → executing → completed | failed
 *
 * Uses renderHook to test React context-based state.
 */
import { ActionStateProvider } from "@/lib/cockpit/action-context";
import { FocusStateProvider } from "@/lib/cockpit/focus-context";
import { GovernanceStateProvider } from "@/lib/cockpit/governance-context";
import { useActionState, useCanPerformAction } from "@/lib/cockpit/use-actions";
import { useFocusSelection } from "@/lib/cockpit/use-focus";
import { act, renderHook } from "@testing-library/react";

// ============================================================
// TEST WRAPPER
// ============================================================

// Mock next/navigation for FocusStateProvider
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/",
}));

// Mock governance adapter to return mock data synchronously (tests use fake timers)
vi.mock("@/lib/cockpit/adapters/governance.adapter", () => ({
  fetchGovernanceData: vi.fn().mockResolvedValue({
    posture: {
      oversightMode: "supervised",
      determinismStatus: "SEALED",
      sealValidation: "VALID",
      incidentFlag: false,
      activePolicyCount: 3,
      activePolicyProfile: "production-standard-v2",
      lastPolicyChange: null,
      dataMode: "MOCK",
    },
    authority: {
      role: "operator",
      privilegeLevel: "OPERATOR",
      permittedActions: ["declare-incident", "acknowledge-alert", "submit-decision"],
      scopeBoundaries: { tenantIds: "all", subsystems: "all" },
    },
    constraints: [],
    escalationConditions: [],
    source: "mock",
  }),
}));

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <GovernanceStateProvider>
      <FocusStateProvider>
        <ActionStateProvider>
          {children}
        </ActionStateProvider>
      </FocusStateProvider>
    </GovernanceStateProvider>
  );
}

// ============================================================
// ACTION LIFECYCLE
// ============================================================

describe("Action State — Lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts in idle state", () => {
    const { result } = renderHook(() => useActionState(), { wrapper: Wrapper });
    expect(result.current.status).toBe("idle");
    expect(result.current.isIdle).toBe(true);
    expect(result.current.currentAction).toBeNull();
    expect(result.current.preview).toBeNull();
  });

  it("transitions to preview on initiateAction", async () => {
    const { result } = renderHook(() => useActionState(), { wrapper: Wrapper });
    await act(async () => { vi.advanceTimersByTime(200); });

    act(() => {
      result.current.initiateAction("declare-incident", null);
    });

    expect(result.current.status).toBe("preview");
    expect(result.current.isPreviewing).toBe(true);
    expect(result.current.currentAction).toBe("declare-incident");
    expect(result.current.preview).not.toBeNull();
  });

  it("preview contains expected receipt type", async () => {
    const { result } = renderHook(() => useActionState(), { wrapper: Wrapper });
    await act(async () => { vi.advanceTimersByTime(200); });

    act(() => {
      result.current.initiateAction("declare-incident", null);
    });

    expect(result.current.preview?.expectedReceiptType).toBe("IncidentDeclarationReceipt");
    expect(result.current.preview?.irreversible).toBe(true);
  });

  it("preview contains causal impact", async () => {
    const { result } = renderHook(() => useActionState(), { wrapper: Wrapper });
    await act(async () => { vi.advanceTimersByTime(200); });

    act(() => {
      result.current.initiateAction("declare-incident", null);
    });

    expect(result.current.preview?.causalImpact.length).toBeGreaterThan(0);
    expect(result.current.preview?.causalImpact).toContain("Incident mode will activate");
  });

  it("returns to idle on cancelAction", async () => {
    const { result } = renderHook(() => useActionState(), { wrapper: Wrapper });
    await act(async () => { vi.advanceTimersByTime(200); });

    act(() => {
      result.current.initiateAction("declare-incident", null);
    });
    expect(result.current.status).toBe("preview");

    act(() => {
      result.current.cancelAction();
    });
    expect(result.current.status).toBe("idle");
    expect(result.current.isIdle).toBe(true);
    expect(result.current.preview).toBeNull();
  });

  it("transitions to executing then completed on confirmAction", async () => {
    const { result } = renderHook(() => useActionState(), { wrapper: Wrapper });

    // Advance past governance mock load (100ms)
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    act(() => {
      result.current.initiateAction("declare-incident", null);
    });

    // confirmAction uses setTimeout(500ms) internally
    await act(async () => {
      const confirmPromise = result.current.confirmAction();
      vi.advanceTimersByTime(600);
      await confirmPromise;
    });

    expect(result.current.status).toBe("completed");
    expect(result.current.isCompleted).toBe(true);
    expect(result.current.result).not.toBeNull();
    expect(result.current.result?.receiptId).toBeTruthy();
    expect(result.current.result?.receiptHash).toBeTruthy();
  });

  it("completed action auto-selects receipt in focus state", async () => {
    const { result } = renderHook(
      () => ({
        action: useActionState(),
        focus: useFocusSelection(),
      }),
      { wrapper: Wrapper },
    );

    // Advance past governance mock load
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    act(() => {
      result.current.action.initiateAction("declare-incident", null);
    });

    await act(async () => {
      const confirmPromise = result.current.action.confirmAction();
      vi.advanceTimersByTime(600);
      await confirmPromise;
    });

    // Focus should now have the receipt selected
    expect(result.current.focus.selection).not.toBeNull();
    expect(result.current.focus.selection?.kind).toBe("receipt");
    expect(result.current.focus.selection?.anchorType).toBe("anchored");
  });
});

// ============================================================
// PERMISSION GATING
// ============================================================

describe("Action State — Permission Gating", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("permits actions in the operator's permitted list", async () => {
    const { result } = renderHook(
      () => useCanPerformAction("declare-incident"),
      { wrapper: Wrapper },
    );

    // Advance past governance mock load
    await act(async () => { vi.advanceTimersByTime(200); });

    expect(result.current.permitted).toBe(true);
    expect(result.current.reason).toBeNull();
  });

  it("denies action when another is in progress", async () => {
    const { result } = renderHook(
      () => ({
        action: useActionState(),
        canDeclare: useCanPerformAction("declare-incident"),
      }),
      { wrapper: Wrapper },
    );

    await act(async () => { vi.advanceTimersByTime(200); });

    act(() => {
      result.current.action.initiateAction("declare-incident", null);
    });

    expect(result.current.canDeclare.permitted).toBe(false);
    expect(result.current.canDeclare.reason).toContain("Another action is in progress");
  });

  it("denies unpermitted actions", async () => {
    // "escalate" is not in the mock permitted list
    const { result } = renderHook(
      () => useCanPerformAction("escalate"),
      { wrapper: Wrapper },
    );

    await act(async () => { vi.advanceTimersByTime(200); });

    expect(result.current.permitted).toBe(false);
    expect(result.current.reason).toContain("not permitted");
  });
});

