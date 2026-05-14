# Onboarding Post-Audit Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Address all 6 Playwright audit PR blockers, fix 4 pre-existing test failures now surfaced as blockers, and add required regression coverage.

**Architecture:** Point fixes across three layers: activation copy/language in `state-machine.ts` (already done), invite route fail-closed logic in `provision/route.ts` (already done), client-side API error distinction in `api-keys/page.tsx` (TODO), and targeted test fixes for query ambiguity and coverage gaps.

**Tech Stack:** Next.js 15, React 19, Vitest + @testing-library/react

---

## Baseline Status (verified by running full suite)

The first hardening pass (de11e13) already completed:
- ✅ Scope 1: "Workspace created" → "Resolving workspace binding" in `state-machine.ts`
- ✅ Scope 2: "Workspace prepared." → "Setup choices confirmed." in `complete-step.tsx`
- ✅ Scope 3: Invite token fail-closed (409 for missing workspace, sandbox fallback)
- ✅ Scope 4: `finishOnboarding` sync-writes localStorage before route replace
- ✅ Scope 5a: Sidebar nav already points to `/control`, `/policies`, `/cockpit`

Current failures (4 tests × 2 files + 1 timeout pre-existing):
- `tests/unit/activation/CollectiveReplay.test.tsx` — 3 FAIL (query ambiguity + wrong scenario)
- `tests/unit/app/receipts-page.test.tsx` — 1 FAIL (query ambiguity)
- `tests/unit/app/api/collective-boundary-routes.test.ts` — 1 TIMEOUT (pre-existing, out of scope)

Still missing (scoped to this pass):
- Scope 5b: Navigation tests for `/policies` and `/cockpit` sidebar links
- Scope 6: API keys error vs. empty distinction
- Required: Route gate tests for hard navigation after onboarding completion

---

## File Map

### Modify
- `src/app/api-keys/page.tsx` — add fetch-error tracking, render error state
- `tests/unit/layout/navigation.test.ts` — add /policies and /cockpit link tests
- `tests/unit/first-run/state.test.ts` — add hard-navigation route mapping tests
- `tests/unit/activation/CollectiveReplay.test.tsx` — fix 3 query-ambiguity failures
- `tests/unit/app/receipts-page.test.tsx` — fix 1 query-ambiguity failure

### Create
- `tests/unit/layout/api-keys-page.test.tsx` — API keys error vs. empty state test

---

## Task 1: Fix receipts-page test query ambiguity

**Problem:** `getByText(/sample receipts/i)` matches BOTH the DataSourceNotice title ("Sample receipts") AND the loading indicator ("Loading sample receipts..."), causing a "Found multiple elements" error.

**Files:**
- Modify: `tests/unit/app/receipts-page.test.tsx`

- [ ] **Step 1: Write the fix**

Replace the ambiguous regex query with an exact string query that only matches the DataSourceNotice title:

In `tests/unit/app/receipts-page.test.tsx`, change line 52:
```ts
// before
expect(screen.getByText(/sample receipts/i)).toBeInTheDocument();

// after
expect(screen.getByText("Sample receipts")).toBeInTheDocument();
```

- [ ] **Step 2: Run the test to verify it passes**

```
npx vitest run tests/unit/app/receipts-page.test.tsx --reporter=verbose
```

Expected: 1 test PASS — "labels sample data clearly"

- [ ] **Step 3: Commit**

```bash
git add tests/unit/app/receipts-page.test.tsx
git commit -m "fix(test): disambiguate receipts-page sample-data query"
```

---

## Task 2: Fix CollectiveReplay test — query ambiguity for /directive/ and /anchored in causal history/

**Problem 1:** `getByText(/directive/i)` matches BOTH the section title "Directive" (inside the inspection panel) AND the SVG `<text>` element "Derived from directive" (inside the scenario goal node). Even though the SVG has `aria-hidden="true"`, `@testing-library/dom@10` searches all DOM text nodes for `getByText`, not just accessible ones.

**Problem 2:** `getByText(/anchored in causal history/i)` matches BOTH the deep-inspection panel header paragraph ("Governed understanding remains anchored in causal history...") AND the Causal Lineage section paragraph ("This approval is anchored in causal history.").

**Fix:** Scope both queries to `within(screen.getByTestId("deep-inspection-panel"))` so they search only the known panel container, avoiding the SVG and header ambiguity.

**Files:**
- Modify: `tests/unit/activation/CollectiveReplay.test.tsx`

- [ ] **Step 1: Fix "renders the required inspection sections" test (line 72-83)**

Import `within` from `@testing-library/react` at the top of the file (add it to existing import):
```ts
import { render, screen, within } from "@testing-library/react";
```

Replace the assertions in the "renders the required inspection sections" test:
```ts
it("renders the required inspection sections", async () => {
  const user = userEvent.setup();
  render(<CollectiveReplay />);
  await user.click(screen.getByRole("button", { name: /inspect decision/i }));

  const panel = screen.getByTestId("deep-inspection-panel");
  expect(within(panel).getByText("Directive")).toBeInTheDocument();
  expect(within(panel).getByText("Decision Path")).toBeInTheDocument();
  expect(within(panel).getByText("Governance Checks")).toBeInTheDocument();
  expect(within(panel).getByText("Receipt Anchors")).toBeInTheDocument();
  expect(within(panel).getByText("Causal Lineage")).toBeInTheDocument();
  expect(within(panel).getByText("Outcome Meaning")).toBeInTheDocument();
});
```

- [ ] **Step 2: Fix "renders the required causal-history and receipt phrasing" test (line 85-92)**

Replace the assertions:
```ts
it("renders the required causal-history and receipt phrasing", async () => {
  const user = userEvent.setup();
  render(<CollectiveReplay />);
  await user.click(screen.getByRole("button", { name: /inspect decision/i }));

  const panel = screen.getByTestId("deep-inspection-panel");
  expect(within(panel).getByText(/anchored in causal history/i)).toBeInTheDocument();
  expect(within(panel).getByText(/reconstructable from receipts/i)).toBeInTheDocument();
});
```

Wait — this still might find two matches inside the panel (header text and Causal Lineage section). Use `getAllByText` and assert at least one exists:
```ts
it("renders the required causal-history and receipt phrasing", async () => {
  const user = userEvent.setup();
  render(<CollectiveReplay />);
  await user.click(screen.getByRole("button", { name: /inspect decision/i }));

  const panel = screen.getByTestId("deep-inspection-panel");
  expect(within(panel).getAllByText(/anchored in causal history/i).length).toBeGreaterThanOrEqual(1);
  expect(within(panel).getAllByText(/reconstructable from receipts/i).length).toBeGreaterThanOrEqual(1);
});
```

- [ ] **Step 3: Run both fixed tests to verify**

```
npx vitest run tests/unit/activation/CollectiveReplay.test.tsx --reporter=verbose
```

Expected: At minimum "renders the required inspection sections" and "renders the required causal-history and receipt phrasing" now PASS. (The third test is handled in Task 3.)

---

## Task 3: Fix CollectiveReplay test — wrong scenario content (MFA + scoped)

**Problem:** The test "shows selected-branch detail and rejected branch reasons in inspection mode" checks for content from the `iam-expansion` scenario ("MFA + scoped", "Privilege exceeds policy", "Missing strong auth"). The component starts at `scenarioIndex=0` which is `db-migration`. The IAM content never appears on first render.

**Fix:** Update the test to check for `db-migration` scenario content (the scenario that IS rendered on initial load). The selected path in db-migration is "Snapshot + run · Rollback-safe". Rejected paths: p1 "No rollback path", p2 "Policy window not met", p4 "Change blocked by urgency".

**Files:**
- Modify: `tests/unit/activation/CollectiveReplay.test.tsx`

- [ ] **Step 1: Update the third failing test (lines 94-102)**

Replace:
```ts
it("shows selected-branch detail and rejected branch reasons in inspection mode", async () => {
  const user = userEvent.setup();
  render(<CollectiveReplay />);
  await user.click(screen.getByRole("button", { name: /inspect decision/i }));

  const panel = screen.getByTestId("deep-inspection-panel");
  expect(within(panel).getByText(/snapshot \+ run/i)).toBeInTheDocument();
  expect(screen.getByTestId("rejected-branch-p1")).toHaveTextContent(/no rollback path/i);
  expect(screen.getByTestId("rejected-branch-p2")).toHaveTextContent(/policy window not met/i);
});
```

Note: `rejected-branch-p1` and `rejected-branch-p2` are `data-testid` attributes set on the rejected path elements (by `path.id`). For `db-migration`, p1 is "Execute now / No rollback path" and p2 is "Stage first / Policy window not met". These `data-testid` values are correct for the db-migration scenario.

- [ ] **Step 2: Run the full CollectiveReplay test suite**

```
npx vitest run tests/unit/activation/CollectiveReplay.test.tsx --reporter=verbose
```

Expected: All 12 CollectiveReplay tests PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/unit/activation/CollectiveReplay.test.tsx tests/unit/app/receipts-page.test.tsx
git commit -m "fix(test): fix CollectiveReplay and receipts query ambiguity"
```

---

## Task 4: Add sidebar route integrity tests (Scope 5b)

**Context:** The navigation currently maps:
- "Guardrails" → `/policies` (not `/guardrails` — route exists at `src/app/policies/`)
- "Diagnostics" → `/cockpit` (not `/diagnostics` — route exists at `src/app/cockpit/`)
- "Workspace" → `/control` (not `/workspace`)

The existing test file covers `/control`, `/api-keys`, `/setup`, `/cortex` but NOT `/policies` or `/cockpit`.

**Files:**
- Modify: `tests/unit/layout/navigation.test.ts`

- [ ] **Step 1: Add route integrity tests**

Append to `tests/unit/layout/navigation.test.ts`:
```ts
it("places /policies under Prepare as 'Guardrails'", () => {
  const prepare = navigationSections.find((s) => s.title === "Prepare");
  expect(prepare).toBeDefined();
  const guardrails = prepare!.items.find((i) => i.href === "/policies");
  expect(guardrails).toBeDefined();
  expect(guardrails!.label).toBe("Guardrails");
});

it("places /cockpit under Advanced as 'Diagnostics'", () => {
  const advanced = navigationSections.find((s) => s.title === "Advanced");
  expect(advanced).toBeDefined();
  const diagnostics = advanced!.items.find((i) => i.href === "/cockpit");
  expect(diagnostics).toBeDefined();
  expect(diagnostics!.label).toBe("Diagnostics");
});

it("does not link to any unimplemented route aliases", () => {
  const hrefs = navigationSections.flatMap((s) => s.items.map((i) => i.href));
  expect(hrefs).not.toContain("/workspace");
  expect(hrefs).not.toContain("/guardrails");
  expect(hrefs).not.toContain("/diagnostics");
});
```

- [ ] **Step 2: Run the navigation test suite**

```
npx vitest run tests/unit/layout/navigation.test.ts --reporter=verbose
```

Expected: All tests PASS (3 new + 6 existing = 9 total).

- [ ] **Step 3: Commit**

```bash
git add tests/unit/layout/navigation.test.ts
git commit -m "test(navigation): add sidebar route integrity assertions"
```

---

## Task 5: Add route gate tests for hard navigation after onboarding completion (Scope 4 regression)

**Context:** After onboarding completes, users navigating directly to `/receipts`, `/control`, `/cortex`, `/settings`, `/api-keys` must NOT be redirected to `/activate`. The `getFirstRunStageForRoute` function maps these routes to `"app"` stage. The existing tests only cover `/cockpit` explicitly.

**Files:**
- Modify: `tests/unit/first-run/state.test.ts`

- [ ] **Step 1: Add hard-navigation route tests**

Append a new describe block to `tests/unit/first-run/state.test.ts`:
```ts
describe("hard navigation after onboarding completion", () => {
  it("maps /receipts to the app stage", () => {
    expect(getFirstRunStageForRoute("/receipts")).toBe("app");
  });

  it("maps /control to the app stage", () => {
    expect(getFirstRunStageForRoute("/control")).toBe("app");
  });

  it("maps /cortex to the app stage", () => {
    expect(getFirstRunStageForRoute("/cortex")).toBe("app");
  });

  it("maps /settings to the app stage", () => {
    expect(getFirstRunStageForRoute("/settings")).toBe("app");
  });

  it("maps /api-keys to the app stage", () => {
    expect(getFirstRunStageForRoute("/api-keys")).toBe("app");
  });

  it("allows app-stage access to all post-setup routes", () => {
    const routes = ["/receipts", "/control", "/cortex", "/settings", "/api-keys", "/cockpit"];
    for (const route of routes) {
      const stage = getFirstRunStageForRoute(route);
      expect(
        canAccessFirstRunStage("app", { provisioningComplete: true, stage })
      ).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run the first-run state test suite**

```
npx vitest run tests/unit/first-run/state.test.ts --reporter=verbose
```

Expected: All tests PASS (6 new + 16 existing = 22 total).

- [ ] **Step 3: Commit**

```bash
git add tests/unit/first-run/state.test.ts
git commit -m "test(first-run): add hard-navigation route gate coverage"
```

---

## Task 6: API keys error honesty — implementation (Scope 6)

**Problem:** `src/app/api-keys/page.tsx` currently does `load().catch(() => setKeys([]))`. This silently converts a fetch failure into an empty key list, so "Keys in scope: 0" appears the same whether there are 0 keys OR the API is unavailable.

**Fix:** Add a `fetchError` boolean state. Show a distinct "Keys unavailable" error state when the fetch fails, distinct from the legitimate empty-list state.

**Files:**
- Modify: `src/app/api-keys/page.tsx`

- [ ] **Step 1: Write the failing test first (TDD)**

Create `tests/unit/layout/api-keys-page.test.tsx`:
```tsx
import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ApiKeysPage from "@/app/api-keys/page";

vi.mock("@/components/layout", () => ({
  Shell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/layout/page-container", () => ({
  PageContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PageHeader: ({ title }: { title: ReactNode }) => <h1>{title}</h1>,
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardHeader: ({ title }: { title: ReactNode }) => <h2>{title}</h2>,
  CardContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

vi.mock("@/components/control-plane", () => ({
  TenantScopeGuard: () => null,
}));

function makeTenantBinding(overrides = {}) {
  return {
    isConfirmed: true,
    confirmedTenant: { id: "ten_test", name: "Test Workspace", status: "active", createdAt: "" },
    confirmedEnvironment: "sandbox",
    ...overrides,
  };
}

vi.mock("@/lib/control-plane/tenant-binding", () => ({
  useTenantBinding: () => makeTenantBinding(),
}));

describe("ApiKeysPage — error vs. empty state", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("shows 'Keys unavailable' when the API fetch throws", async () => {
    vi.mocked(await import("@/lib/api/control-plane")).listApiKeys = vi
      .fn()
      .mockRejectedValue(new Error("Network error"));

    render(<ApiKeysPage />);

    await waitFor(() => {
      expect(screen.getByText(/keys unavailable/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/keys in scope/i)).not.toBeInTheDocument();
  });

  it("shows 'Keys in scope: 0' when the API returns an empty array", async () => {
    vi.mocked(await import("@/lib/api/control-plane")).listApiKeys = vi.fn().mockResolvedValue([]);

    render(<ApiKeysPage />);

    await waitFor(() => {
      expect(screen.getByText(/keys in scope: 0/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/keys unavailable/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the new test to confirm it fails**

```
npx vitest run tests/unit/layout/api-keys-page.test.tsx --reporter=verbose
```

Expected: FAIL — "keys unavailable" not found because the current page uses `setKeys([])` for all errors.

- [ ] **Step 3: Implement the error state in api-keys/page.tsx**

Replace the current `api-keys/page.tsx` with the following (full file, since the change touches multiple sections):

```tsx
"use client";

import * as React from "react";
import { TenantScopeGuard } from "@/components/control-plane";
import { Shell } from "@/components/layout";
import { Card, CardContent, CardHeader, PageContainer, PageHeader } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { listApiKeys } from "@/lib/api/control-plane";
import type { ApiKeyPreview } from "@/lib/api/types";
import { useTenantBinding } from "@/lib/control-plane/tenant-binding";

export default function ApiKeysPage() {
  const { isConfirmed, confirmedTenant, confirmedEnvironment } = useTenantBinding();
  const [keys, setKeys] = React.useState<ApiKeyPreview[]>([]);
  const [fetchError, setFetchError] = React.useState(false);

  React.useEffect(() => {
    if (!confirmedTenant) {
      setKeys([]);
      setFetchError(false);
      return;
    }

    setFetchError(false);
    listApiKeys(confirmedTenant.id)
      .then((result) => {
        setKeys(result);
      })
      .catch(() => {
        setFetchError(true);
      });
  }, [confirmedTenant]);

  return (
    <Shell>
      <PageContainer>
        <PageHeader title="API Keys" description="Live and test credentials for the explicitly bound tenant and environment." />

        {!isConfirmed && <TenantScopeGuard description="Credential surfaces require explicit tenant and environment confirmation." />}

        {isConfirmed && confirmedTenant && (
          <div className="space-y-4">
            <Card>
              <CardHeader title="Bound credential scope" description="Credential issuance now follows explicit tenant binding instead of implicit membership order." />
              <CardContent className="font-mono text-sm text-[#C5C6C7]">
                <div>Tenant: {confirmedTenant.name}</div>
                <div>Environment: {confirmedEnvironment}</div>
                {fetchError ? (
                  <div className="mt-2 text-[#FF6A6A]">Keys unavailable — credential service did not respond.</div>
                ) : (
                  <div>Keys in scope: {keys.length}</div>
                )}
              </CardContent>
            </Card>

            {!fetchError && (
              <div className="grid grid-cols-1 gap-4">
                {keys.map((key) => (
                  <Card key={key.id}>
                    <CardHeader
                      title={key.name}
                      description={<span className="font-mono text-xs text-[#C5C6C7] opacity-60">keon_{key.mode}_{key.prefix}_...</span>}
                      actions={<Badge variant={key.mode === "live" ? "warning" : "healthy"}>{key.mode}</Badge>}
                    />
                    <CardContent className="grid grid-cols-1 gap-2 md:grid-cols-4">
                      <div className="font-mono text-sm text-[#C5C6C7]">Status: {key.status}</div>
                      <div className="font-mono text-sm text-[#C5C6C7]">Environment: {key.environmentId}</div>
                      <div className="font-mono text-sm text-[#C5C6C7]">Last used: {key.lastUsedAtUtc ?? "never"}</div>
                      <div className="font-mono text-sm text-[#C5C6C7]">Shown once: yes</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </PageContainer>
    </Shell>
  );
}
```

- [ ] **Step 4: Run the new test to verify it passes**

```
npx vitest run tests/unit/layout/api-keys-page.test.tsx --reporter=verbose
```

Expected: 2 tests PASS — "keys unavailable" for errors, "keys in scope: 0" for empty.

- [ ] **Step 5: Commit**

```bash
git add src/app/api-keys/page.tsx tests/unit/layout/api-keys-page.test.tsx
git commit -m "feat(api-keys): distinguish fetch-error from empty key list"
```

---

## Task 7: Verification run

- [ ] **Step 1: Run the full unit test suite**

```
npx vitest run --reporter=verbose 2>&1 | tail -20
```

Expected outcome:
- `tests/unit/activation/CollectiveReplay.test.tsx` — 12 PASS
- `tests/unit/app/receipts-page.test.tsx` — 1 PASS
- `tests/unit/layout/navigation.test.ts` — 9 PASS
- `tests/unit/first-run/state.test.ts` — 22 PASS
- `tests/unit/layout/api-keys-page.test.tsx` — 2 PASS
- All pre-existing passes remain green
- Pre-existing `collective-boundary-routes.test.ts` timeout is still the only failure (out of scope)

- [ ] **Step 2: Run lint**

```
pnpm lint
```

Expected: No new lint errors.

- [ ] **Step 3: Run build**

```
pnpm build
```

Expected: Build succeeds.

- [ ] **Step 4: Run coverage (optional, informational)**

```
npx vitest run --coverage 2>&1 | grep -E "Statements|Branches|Functions|Lines" | head -10
```

---

## Self-Review

### Spec Coverage Check

| Scope Item | Status |
|---|---|
| 1. Activation language "Workspace created" → "Workspace binding prepared" | ✅ Done in prior pass (test: ProvisioningPanel "Resolving workspace binding") |
| 2. Ready-state language "Workspace prepared" → "Workspace setup complete" | ✅ Done in prior pass (complete-step.tsx title = "Setup choices confirmed.") |
| 3. Invite token fail-closed | ✅ Done in prior pass (409 for missing workspace, sandbox fallback flag) |
| 4. Post-setup route durability | ✅ Store sync-write done + Task 5 adds route gate tests |
| 5. Sidebar route integrity | ✅ Routes already correct + Task 4 adds /policies and /cockpit tests |
| 6. API error honesty | ✅ Task 6 adds error state + test |
| PR blockers: CollectiveReplay failures | ✅ Tasks 2 + 3 |
| PR blockers: receipts-page failure | ✅ Task 1 |

### Placeholder Scan
No TBD, TODO, or "similar to task N" references. All code is complete.

### Type Consistency
- `ApiKeyPreview[]` — same as import from `@/lib/api/types`, consistent with existing usage in api-keys/page.tsx
- `within` imported from `@testing-library/react` — already a transitive dependency via existing tests
- `getFirstRunStageForRoute`, `canAccessFirstRunStage` — same signatures as used in existing first-run tests
