$specPath = "d:\Repos\keon-omega\keon-docs-internal\caes-prep\CAES_INTERNAL_L3_SPEC_v1.md"

$header = @'
# Internal Level 3 Specification -- v1

> **RESTRICTED.** This document is internal to Keon Systems.
> Do not copy, excerpt, or reference from any public repository, binary, or documentation.
> Last updated: 2026-03-02 | Status: SKELETON -- Clint to fill content sections
> Source of truth for invariant list: MASTER_PLAN.md Section C

---

## Purpose

This document specifies the 17 invariants that constitute internal certification Level 3.
It is the authoritative prose specification that workstream leads implement against and that
the certification reviewer signs off on.

The checklist in MASTER_PLAN.md Section C is the machine-readable pass/fail ledger.
This document provides the normative **definition** for each invariant.

---

## How to Use This Document

1. Each invariant section has: **Definition**, **Rationale**, **Acceptance Criteria**, **Exclusions**.
2. **Clint fills all four subsections** for each invariant before Phase 2 (by end of W2).
3. Workstream leads reference the invariant ID (e.g., `L3-01`) in all PRs and comments.
4. The compliance matrix (Week 11) links back to these IDs.
5. Do NOT add new invariants without a signed amendment from Clint.

---

## Invariant Index

| ID | Title | WS Owner | Status |
|---|---|---|---|
| L3-01 | Deterministic PolicyHash canonicalization | WS-A | SKELETON |
| L3-02 | Append-only spine | WS-B | SKELETON |
| L3-03 | Signed Decision Receipts -- bound key role | WS-C | SKELETON |
| L3-04 | Fail-closed under chaos -- 8 modes | WS-F | SKELETON |
| L3-05 | Deterministic Evidence Pack export | WS-D | SKELETON |
| L3-06 | Offline verification -- zero network | WS-E / WS-G | SKELETON |
| L3-07 | Human Authority delegation + binding | WS-H / WS-C | SKELETON |
| L3-08 | Audit-ready artifact production | WS-D | SKELETON |
| L3-09 | No silent defaults -- version mandatory | WS-D / WS-E | SKELETON |
| L3-10 | Cross-pack provenance chain | WS-D / WS-E | SKELETON |
| L3-11 | Trust bundle integrity | WS-C | SKELETON |
| L3-12 | PolicyHash in evidence pack | WS-A / WS-D | SKELETON |
| L3-13 | DelegationChain artifact in evidence pack | WS-C / WS-D | SKELETON |
| L3-14 | ChaosTestAttestation in evidence pack | WS-F / WS-D | SKELETON |
| L3-15 | Retention enforcement survives chaos | WS-F | SKELETON |
| L3-16 | Structured error codes -- no raw exceptions | All WS | SKELETON |
| L3-17 | Delegation binding target mandatory | WS-H / WS-C | SKELETON |

---

## L3-01 -- Deterministic PolicyHash Canonicalization

**Code area:** `PolicyHashCanonicalizer.cs`
**Test:** `PolicyHashDeterminismTests.cs`
**Validation:** 1000-run CI double-run byte-identical; Win + Linux

### Definition
> _[Clint to fill]_

### Rationale
> _[Clint to fill]_

### Acceptance Criteria
- [ ] CI platform matrix green (Win + Linux)
- [ ] 1000-run double-run produces byte-identical hash on all platform targets
- [ ] RFC 8785 (JCS) compliant
- [ ] _[Clint to add additional criteria]_

### Exclusions
> _[Clint to fill -- what is explicitly out of scope for this invariant]_

---

## L3-02 -- Append-Only Spine

**Code area:** `SpineInvariantEnforcer.cs`
**Test:** `SpineInvariantTests.cs`
**Validation:** Violation => `KEON_SPINE_*`; no DB-level escape hatch

### Definition
> _[Clint to fill]_

### Rationale
> _[Clint to fill]_

### Acceptance Criteria
- [ ] `KEON_SPINE_DUPLICATE_RECEIPT` -- hard reject, dedicated test
- [ ] `KEON_SPINE_ORDER_VIOLATION` -- hard reject, dedicated test
- [ ] `KEON_SPINE_VERSION_MISMATCH` -- hard reject, dedicated test
- [ ] Zero warning paths -- all violations are hard failures, never warnings
- [ ] DB-agnostic: no SQLite-only or provider-specific escape hatch
- [ ] _[Clint to add additional criteria]_

### Exclusions
> _[Clint to fill]_

---

## L3-03 -- Signed Decision Receipts -- Bound Key Role

**Code area:** `Ed25519.cs`, `KeyRoleEnforcer.cs`
**Test:** `Phase4AttestationTests.cs`
**Validation:** Wrong-role key => rejected

### Definition
> _[Clint to fill]_

### Rationale
> _[Clint to fill]_

### Acceptance Criteria
- [ ] Signing with wrong-role key => hard rejection (not warning)
- [ ] Key role validated at receipt creation time, not only at verification time
- [ ] _[Clint to add additional criteria]_

### Exclusions
> _[Clint to fill]_

'@

Set-Content -Path $specPath -Value $header -Encoding UTF8 -NoNewline
Write-Host "HEADER written. Lines: $((Get-Content $specPath).Count)"

