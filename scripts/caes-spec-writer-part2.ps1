$specPath = "d:\Repos\keon-omega\keon-docs-internal\caes-prep\CAES_INTERNAL_L3_SPEC_v1.md"

$part2 = @'

## L3-04 -- Fail-Closed Under Chaos -- 8 Modes

**Code area:** `ChaosHarness.cs`
**Test:** `ChaosHarnessTests.cs`
**Validation:** Each mode => documented exit code; zero silent pass; zero state corruption

### Definition
> _[Clint to fill]_

### Rationale
> _[Clint to fill]_

### Acceptance Criteria
- [ ] C1 (DB write failure mid-receipt) => `KEON_SPINE_WRITE_FAILED`
- [ ] C2 (Key rotation mid-signing) => `KEON_KEY_ROTATION_CONFLICT`
- [ ] C3 (Clock skew beyond tolerance) => `KEON_TEMPORAL_CLOCK_SKEW_EXCEEDED`
- [ ] C4 (Network partition during pack export) => `KEON_PACK_INCOMPLETE`
- [ ] C5 (Disk full during ZIP write) => deterministic error, no corrupt pack produced
- [ ] C6 (Duplicate receipt injection) => `KEON_SPINE_DUPLICATE_RECEIPT`
- [ ] C7 (PolicyHash mismatch) => `KEON_POLICY_HASH_MISMATCH`
- [ ] C8 (DelegationChain expiry during verification) => `KEON_DELEGATION_EXPIRED`
- [ ] Post-chaos: non-chaos test suite remains green
- [ ] chaos-isolation required status check passing in CI
- [ ] _[Clint to add additional criteria]_

### Exclusions
> _[Clint to fill]_

---

## L3-05 -- Deterministic Evidence Pack Export

**Code area:** `Keon.BundleWriter`
**Test:** `PackDeterminismTests.cs`
**Validation:** Two runs same scope => byte-identical ZIP

### Definition
> _[Clint to fill]_

### Rationale
> _[Clint to fill]_

### Acceptance Criteria
- [ ] Two independent builds of same scope => byte-identical ZIP output
- [ ] File ordering, timestamps, and compression settings are deterministic
- [ ] _[Clint to add additional criteria]_

### Exclusions
> _[Clint to fill]_

---

## L3-06 -- Offline Verification -- Zero Network

**Code area:** `--offline --bundle` CLI flag path
**Test:** Air-gap acceptance test
**Validation:** Air-gap VM: 0 outbound packets (Wireshark confirmed)

### Definition
> _[Clint to fill]_

### Rationale
> _[Clint to fill]_

### Acceptance Criteria
- [ ] `keon verify-pack --offline --bundle <path>` passes with zero network calls
- [ ] Air-gap VM test: 0 outbound packets confirmed via Wireshark capture
- [ ] All required data (trust bundle, schema) shipped inside the pack or bundle flag
- [ ] _[Clint to add additional criteria]_

### Exclusions
> _[Clint to fill]_

---

## L3-07 -- Human Authority Delegation + Binding

**Code area:** `DelegationChainValidator.cs`
**Test:** `DelegationChainTests.cs`
**Validation:** Missing binding => `KEON_DELEGATION_BINDING_MISSING`

### Definition
> _[Clint to fill]_

### Rationale
> _[Clint to fill]_

### Acceptance Criteria
- [ ] `KEON_DELEGATION_DEPTH_EXCEEDED` -- tested
- [ ] `KEON_DELEGATION_EXPIRED` -- tested
- [ ] `KEON_DELEGATION_REVOKED` -- tested
- [ ] `KEON_DELEGATION_SCOPE_VIOLATION` -- tested
- [ ] `KEON_DELEGATION_BINDING_MISSING` -- tested
- [ ] `KEON_DELEGATION_BINDING_MISMATCH` -- tested
- [ ] `KEON_DELEGATION_SIG_INVALID` -- tested
- [ ] _[Clint to add additional criteria]_

### Exclusions
> _[Clint to fill]_

---

## L3-08 -- Audit-Ready Artifact Production

**Code area:** Pack extension schema
**Test:** `EvidencePackExtensionTests.cs`
**Validation:** All artifact types present; JSON Schema validates

### Definition
> _[Clint to fill]_

### Rationale
> _[Clint to fill]_

### Acceptance Criteria
- [ ] All required artifact types present in every exported pack
- [ ] JSON Schema validation passes for all artifact envelopes
- [ ] _[Clint to add additional criteria]_

### Exclusions
> _[Clint to fill]_

'@

Add-Content -Path $specPath -Value $part2 -Encoding UTF8
Write-Host "PART2 appended. Lines: $((Get-Content $specPath).Count)"

