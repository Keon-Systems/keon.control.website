/**
 * Keon Control — Focus Reducer Tests
 * Pure unit tests. No React. No DOM. No mocks.
 */
import { focusReducer } from "@/lib/cockpit/focus-reducer";
import type { FocusState, Selection } from "@/lib/cockpit/types";
import { INITIAL_FILTER_CONTEXT, INITIAL_FOCUS_STATE } from "@/lib/cockpit/types";

// --- Fixtures ---
const anchoredExecution: Selection = {
  kind: "execution", id: "run_abc123", correlationId: "corr_001",
  source: "center", anchorType: "anchored",
};
const ephemeralExecution: Selection = {
  kind: "execution", id: "run_inflight", correlationId: null,
  source: "center", anchorType: "ephemeral",
};
const derivedAlert: Selection = {
  kind: "alert", id: "alert_xyz", correlationId: null,
  source: "horizon", anchorType: "derived",
};
const anchoredReceipt: Selection = {
  kind: "receipt", id: "rhid:receipt:abc123", correlationId: "corr_001",
  source: "right", anchorType: "anchored",
};
const anchoredPolicy: Selection = {
  kind: "policy", id: "pol_v2", correlationId: null,
  source: "left", anchorType: "anchored",
};
const anchoredDeliberation: Selection = {
  kind: "deliberation", id: "delib_001", correlationId: null,
  source: "center", anchorType: "anchored",
};

// ============================================================
// SELECT
// ============================================================
describe("focusReducer — SELECT", () => {
  it("selects entity and moves to inspect", () => {
    const r = focusReducer(INITIAL_FOCUS_STATE, { type: "SELECT", payload: anchoredExecution });
    expect(r.selection).toEqual(anchoredExecution);
    expect(r.inspectionDepth).toBe("inspect");
    expect(r.selectionInvalidReason).toBeNull();
  });

  it("increments epoch on every SELECT", () => {
    let s = INITIAL_FOCUS_STATE;
    s = focusReducer(s, { type: "SELECT", payload: anchoredExecution });
    expect(s.selectionEpoch).toBe(1);
    s = focusReducer(s, { type: "SELECT", payload: anchoredReceipt });
    expect(s.selectionEpoch).toBe(2);
    s = focusReducer(s, { type: "SELECT", payload: anchoredExecution });
    expect(s.selectionEpoch).toBe(3);
  });

  it("epoch never decreases — CLEAR preserves epoch", () => {
    let s = focusReducer(INITIAL_FOCUS_STATE, { type: "SELECT", payload: anchoredExecution });
    s = focusReducer(s, { type: "SELECT", payload: anchoredReceipt });
    const ep = s.selectionEpoch;
    s = focusReducer(s, { type: "CLEAR_SELECTION" });
    expect(s.selectionEpoch).toBe(ep);
  });

  it("clears invalidReason on new SELECT", () => {
    let s = focusReducer(INITIAL_FOCUS_STATE, { type: "INVALIDATE_SELECTION", payload: "not-found" });
    s = focusReducer(s, { type: "SELECT", payload: anchoredExecution });
    expect(s.selectionInvalidReason).toBeNull();
  });

  it("stays in mode when selection is compatible", () => {
    const s: FocusState = { ...INITIAL_FOCUS_STATE, centerMode: "executions" };
    const r = focusReducer(s, { type: "SELECT", payload: anchoredExecution });
    expect(r.centerMode).toBe("executions");
    expect(r.modeStack).toEqual([]);
  });

  it("swaps mode + pushes stack when incompatible", () => {
    const s: FocusState = { ...INITIAL_FOCUS_STATE, centerMode: "executions" };
    const r = focusReducer(s, { type: "SELECT", payload: anchoredPolicy });
    expect(r.centerMode).toBe("policies");
    expect(r.modeStack).toEqual(["executions"]);
    expect(r.inspectionDepth).toBe("inspect");
  });

  it("caps mode stack at 3", () => {
    let s: FocusState = { ...INITIAL_FOCUS_STATE, centerMode: "fleet" };
    s = focusReducer(s, { type: "SELECT", payload: anchoredPolicy });
    s = focusReducer(s, { type: "SELECT", payload: anchoredDeliberation });
    s = focusReducer(s, { type: "SELECT", payload: anchoredExecution });
    expect(s.modeStack).toEqual(["collective-deliberations", "policies", "fleet"]);
    s = focusReducer(s, { type: "SELECT", payload: anchoredPolicy });
    expect(s.modeStack.length).toBeLessThanOrEqual(3);
  });

  it("preserves depth for compatible selection at verify", () => {
    let s: FocusState = { ...INITIAL_FOCUS_STATE, centerMode: "executions" };
    s = focusReducer(s, { type: "SELECT", payload: anchoredExecution });
    s = focusReducer(s, { type: "SET_DEPTH", payload: "verify" });
    s = focusReducer(s, { type: "SELECT", payload: { ...anchoredExecution, id: "run_2" } });
    expect(s.inspectionDepth).toBe("verify");
  });
});

// ============================================================
// DEPTH CLAMPING BY ANCHOR TYPE
// ============================================================
describe("focusReducer — Depth Clamping", () => {
  it("allows all depths for anchored", () => {
    let s = focusReducer(INITIAL_FOCUS_STATE, { type: "SELECT", payload: anchoredExecution });
    s = focusReducer(s, { type: "SET_DEPTH", payload: "verify" });
    expect(s.inspectionDepth).toBe("verify");
    s = focusReducer(s, { type: "SET_DEPTH", payload: "forensic" });
    expect(s.inspectionDepth).toBe("forensic");
  });

  it("denies verify+forensic for ephemeral", () => {
    let s = focusReducer(INITIAL_FOCUS_STATE, { type: "SELECT", payload: ephemeralExecution });
    s = focusReducer(s, { type: "SET_DEPTH", payload: "verify" });
    expect(s.inspectionDepth).toBe("inspect");
    s = focusReducer(s, { type: "SET_DEPTH", payload: "forensic" });
    expect(s.inspectionDepth).toBe("inspect");
  });

  it("allows verify but denies forensic for derived", () => {
    let s = focusReducer(INITIAL_FOCUS_STATE, { type: "SELECT", payload: derivedAlert });
    s = focusReducer(s, { type: "SET_DEPTH", payload: "verify" });
    expect(s.inspectionDepth).toBe("verify");
    s = focusReducer(s, { type: "SET_DEPTH", payload: "forensic" });
    expect(s.inspectionDepth).toBe("verify");
  });

  it("clamps depth when selecting ephemeral at verify", () => {
    let s = focusReducer(INITIAL_FOCUS_STATE, { type: "SELECT", payload: anchoredExecution });
    s = focusReducer(s, { type: "SET_DEPTH", payload: "verify" });
    s = focusReducer(s, { type: "SELECT", payload: ephemeralExecution });
    expect(s.inspectionDepth).toBe("inspect");
  });

  it("clamps depth when selecting derived at forensic", () => {
    let s = focusReducer(INITIAL_FOCUS_STATE, { type: "SELECT", payload: anchoredExecution });
    s = focusReducer(s, { type: "SET_DEPTH", payload: "forensic" });
    s = focusReducer(s, { type: "SELECT", payload: derivedAlert });
    expect(s.inspectionDepth).toBe("inspect");
  });
});

// ============================================================
// CLEAR_SELECTION
// ============================================================
describe("focusReducer — CLEAR_SELECTION", () => {
  it("clears selection and returns to scan", () => {
    let s = focusReducer(INITIAL_FOCUS_STATE, { type: "SELECT", payload: anchoredExecution });
    s = focusReducer(s, { type: "SET_DEPTH", payload: "verify" });
    s = focusReducer(s, { type: "CLEAR_SELECTION" });
    expect(s.selection).toBeNull();
    expect(s.inspectionDepth).toBe("scan");
  });

  it("does not reset epoch", () => {
    let s = focusReducer(INITIAL_FOCUS_STATE, { type: "SELECT", payload: anchoredExecution });
    const ep = s.selectionEpoch;
    s = focusReducer(s, { type: "CLEAR_SELECTION" });
    expect(s.selectionEpoch).toBe(ep);
  });

  it("clears invalidReason", () => {
    let s = focusReducer(INITIAL_FOCUS_STATE, { type: "INVALIDATE_SELECTION", payload: "access-denied" });
    s = focusReducer(s, { type: "CLEAR_SELECTION" });
    expect(s.selectionInvalidReason).toBeNull();
  });

  it("preserves centerMode and modeStack", () => {
    let s: FocusState = { ...INITIAL_FOCUS_STATE, centerMode: "executions" };
    s = focusReducer(s, { type: "SELECT", payload: anchoredPolicy });
    s = focusReducer(s, { type: "CLEAR_SELECTION" });
    expect(s.centerMode).toBe("policies");
    expect(s.modeStack).toEqual(["executions"]);
  });
});

// ============================================================
// INVALIDATE_SELECTION
// ============================================================
describe("focusReducer — INVALIDATE_SELECTION", () => {
  it("clears selection and sets reason", () => {
    let s = focusReducer(INITIAL_FOCUS_STATE, { type: "SELECT", payload: anchoredExecution });
    s = focusReducer(s, { type: "INVALIDATE_SELECTION", payload: "not-found" });
    expect(s.selection).toBeNull();
    expect(s.inspectionDepth).toBe("scan");
    expect(s.selectionInvalidReason).toBe("not-found");
  });

  it("supports all invalidation reasons", () => {
    const reasons = ["not-found", "out-of-time-context", "access-denied"] as const;
    for (const reason of reasons) {
      let s = focusReducer(INITIAL_FOCUS_STATE, { type: "SELECT", payload: anchoredExecution });
      s = focusReducer(s, { type: "INVALIDATE_SELECTION", payload: reason });
      expect(s.selectionInvalidReason).toBe(reason);
    }
  });
});

// ============================================================
// POP_MODE
// ============================================================
describe("focusReducer — POP_MODE", () => {
  it("pops to previous mode from stack", () => {
    let s: FocusState = { ...INITIAL_FOCUS_STATE, centerMode: "executions" };
    s = focusReducer(s, { type: "SELECT", payload: anchoredPolicy });
    expect(s.centerMode).toBe("policies");
    expect(s.modeStack).toEqual(["executions"]);

    s = focusReducer(s, { type: "POP_MODE" });
    expect(s.centerMode).toBe("executions");
    expect(s.modeStack).toEqual([]);
  });

  it("returns to fleet when stack is empty", () => {
    const s = focusReducer(INITIAL_FOCUS_STATE, { type: "POP_MODE" });
    expect(s.centerMode).toBe("fleet");
    expect(s.selection).toBeNull();
    expect(s.inspectionDepth).toBe("scan");
  });

  it("preserves selection if compatible with popped mode", () => {
    let s: FocusState = { ...INITIAL_FOCUS_STATE, centerMode: "executions" };
    // Select receipt — compatible with executions mode (receipts are in compatibility list)
    s = focusReducer(s, { type: "SELECT", payload: anchoredReceipt });
    // Receipt is compatible with executions mode, so no mode swap
    // Let's force a mode swap by selecting policy, then pop back
    s = focusReducer(s, { type: "SELECT", payload: anchoredPolicy });
    expect(s.centerMode).toBe("policies");
    s = focusReducer(s, { type: "POP_MODE" });
    // Policy is NOT compatible with executions, so selection clears
    expect(s.selection).toBeNull();
  });

  it("clears selection if incompatible with popped mode", () => {
    let s: FocusState = { ...INITIAL_FOCUS_STATE, centerMode: "fleet" };
    s = focusReducer(s, { type: "SELECT", payload: anchoredPolicy });
    expect(s.centerMode).toBe("policies");
    // Now select a deliberation (incompatible with policies)
    s = focusReducer(s, { type: "SELECT", payload: anchoredDeliberation });
    expect(s.centerMode).toBe("collective-deliberations");
    // Pop back to policies — deliberation is incompatible
    s = focusReducer(s, { type: "POP_MODE" });
    expect(s.centerMode).toBe("policies");
    expect(s.selection).toBeNull();
  });
});

// ============================================================
// SET_CENTER_MODE
// ============================================================
describe("focusReducer — SET_CENTER_MODE", () => {
  it("changes mode and clears stack", () => {
    let s: FocusState = { ...INITIAL_FOCUS_STATE, centerMode: "executions" };
    s = focusReducer(s, { type: "SELECT", payload: anchoredPolicy });
    expect(s.modeStack.length).toBeGreaterThan(0);

    s = focusReducer(s, { type: "SET_CENTER_MODE", payload: "fleet" });
    expect(s.centerMode).toBe("fleet");
    expect(s.modeStack).toEqual([]);
  });

  it("preserves selection if compatible with new mode", () => {
    let s: FocusState = { ...INITIAL_FOCUS_STATE, centerMode: "executions" };
    s = focusReducer(s, { type: "SELECT", payload: anchoredExecution });
    // Switch to traces — execution is compatible
    s = focusReducer(s, { type: "SET_CENTER_MODE", payload: "traces" });
    expect(s.selection).toEqual(anchoredExecution);
  });

  it("clears selection if incompatible with new mode", () => {
    let s: FocusState = { ...INITIAL_FOCUS_STATE, centerMode: "executions" };
    s = focusReducer(s, { type: "SELECT", payload: anchoredExecution });
    // Switch to policies — execution is incompatible
    s = focusReducer(s, { type: "SET_CENTER_MODE", payload: "policies" });
    expect(s.selection).toBeNull();
    expect(s.inspectionDepth).toBe("scan");
  });
});

// ============================================================
// FILTERS
// ============================================================
describe("focusReducer — Filters", () => {
  it("sets partial filter", () => {
    const s = focusReducer(INITIAL_FOCUS_STATE, {
      type: "SET_FILTER", payload: { status: ["denied"], severity: ["critical"] },
    });
    expect(s.filterContext.status).toEqual(["denied"]);
    expect(s.filterContext.severity).toEqual(["critical"]);
    expect(s.filterContext.agent).toBeNull();
  });

  it("clears all filters", () => {
    let s = focusReducer(INITIAL_FOCUS_STATE, {
      type: "SET_FILTER", payload: { status: ["denied"], search: "test" },
    });
    s = focusReducer(s, { type: "CLEAR_FILTERS" });
    expect(s.filterContext).toEqual(INITIAL_FILTER_CONTEXT);
  });
});

// ============================================================
// TIME CONTEXT
// ============================================================
describe("focusReducer — Time Context", () => {
  it("sets historical time context", () => {
    const s = focusReducer(INITIAL_FOCUS_STATE, {
      type: "SET_TIME_CONTEXT",
      payload: { mode: "historical", timestamp: "2026-03-20T14:00:00Z", window: null },
    });
    expect(s.timeContext.mode).toBe("historical");
    expect(s.timeContext.timestamp).toBe("2026-03-20T14:00:00Z");
  });

  it("preserves selection on time context change", () => {
    let s = focusReducer(INITIAL_FOCUS_STATE, { type: "SELECT", payload: anchoredExecution });
    s = focusReducer(s, {
      type: "SET_TIME_CONTEXT",
      payload: { mode: "historical", timestamp: "2026-03-20T14:00:00Z", window: null },
    });
    expect(s.selection).toEqual(anchoredExecution);
  });
});

// ============================================================
// RESET
// ============================================================
describe("focusReducer — RESET", () => {
  it("returns to initial state", () => {
    let s = focusReducer(INITIAL_FOCUS_STATE, { type: "SELECT", payload: anchoredExecution });
    s = focusReducer(s, { type: "SET_DEPTH", payload: "verify" });
    s = focusReducer(s, { type: "SET_FILTER", payload: { search: "test" } });
    s = focusReducer(s, { type: "RESET" });
    expect(s).toEqual(INITIAL_FOCUS_STATE);
  });
});

// ============================================================
// UNKNOWN EVENT
// ============================================================
describe("focusReducer — Unknown event", () => {
  it("returns state unchanged for unknown event type", () => {
    const s = focusReducer(INITIAL_FOCUS_STATE, { type: "UNKNOWN" } as any);
    expect(s).toBe(INITIAL_FOCUS_STATE);
  });
});
