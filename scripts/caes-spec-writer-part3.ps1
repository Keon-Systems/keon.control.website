$specPath = "d:\Repos\keon-omega\keon-docs-internal\caes-prep\CAES_INTERNAL_L3_SPEC_v1.md"

$part3 = @'

## L3-09 -- No Silent Defaults -- Version Mandatory

**Code area:** `PackVerifier.cs`
**Test:** `PackVerifierTests.cs`
**Validation:** Missing version => `VerificationException`

### Definition
> _[Clint to fill]_

### Rationale
> _[Clint to fill]_

### Acceptance Criteria
- [ ] Pack with missing schema version => `VerificationException` (not silent default)
- [ ] Pack with unknown version => hard rejection
- [ ] _[Clint to add additional criteria]_

### Exclusions
> _[Clint to fill]_

---

## L3-10 -- Cross-Pack Provenance Chain

**Code area:** `ProvenanceVerifier.cs`
**Test:** `Phase6CrossPackProvenanceTests.cs`
**Validation:** Broken link => `KEON_PROVENANCE_BROKEN`

### Definition
> _[Clint to fill]_

### Rationale
> _[Clint to fill]_

### Acceptance Criteria
- [ ] Broken provenance link => `KEON_PROVENANCE_BROKEN`
- [ ] Missing parent pack reference => hard rejection
- [ ] _[Clint to add additional criteria]_

### Exclusions
> _[Clint to fill]_

---

## L3-11 -- Trust Bundle Integrity

**Code area:** `TrustBundleVerifier.cs`
**Test:** `TrustBundleVerifierTests.cs`
**Validation:** Tampered => fail; expired key => reject

### Definition
> _[Clint to fill]_

### Rationale
> _[Clint to fill]_

### Acceptance Criteria
- [ ] Tampered trust bundle => verification fails
- [ ] Expired key in trust bundle => hard rejection
- [ ] _[Clint to add additional criteria]_

### Exclusions
> _[Clint to fill]_

---

## L3-12 -- PolicyHash in Evidence Pack

**Code area:** `PolicyHashManifest` artifact
**Test:** `EvidencePackExtensionTests.cs`
**Validation:** Absent => L3 check fails; hash recomputable offline

### Definition
> _[Clint to fill]_

### Rationale
> _[Clint to fill]_

### Acceptance Criteria
- [ ] `PolicyHashManifest` artifact absent => L3 compliance check fails
- [ ] Stored hash is recomputable offline from pack contents alone
- [ ] _[Clint to add additional criteria]_

### Exclusions
> _[Clint to fill]_

---

## L3-13 -- DelegationChain Artifact in Evidence Pack

**Code area:** `DelegationChainArtifact`
**Test:** `EvidencePackExtensionTests.cs`
**Validation:** Absent => L3 check fails

### Definition
> _[Clint to fill]_

### Rationale
> _[Clint to fill]_

### Acceptance Criteria
- [ ] `DelegationChainArtifact` absent => L3 compliance check fails
- [ ] Artifact includes all delegation hops in the chain
- [ ] _[Clint to add additional criteria]_

### Exclusions
> _[Clint to fill]_

---

## L3-14 -- ChaosTestAttestation in Evidence Pack

**Code area:** `ChaosTestAttestation`
**Test:** `EvidencePackExtensionTests.cs`
**Validation:** Absent => L3 check fails

### Definition
> _[Clint to fill]_

### Rationale
> _[Clint to fill]_

### Acceptance Criteria
- [ ] `ChaosTestAttestation` absent => L3 compliance check fails
- [ ] Attestation covers all 8 chaos modes (C1-C8)
- [ ] _[Clint to add additional criteria]_

### Exclusions
> _[Clint to fill]_

---

## L3-15 -- Retention Enforcement Survives Chaos

**Code area:** `RetentionEnforcerRunner.cs`
**Test:** `RetentionChaosTests.cs`
**Validation:** DB fail mid-enforce => spine intact

### Definition
> _[Clint to fill]_

### Rationale
> _[Clint to fill]_

### Acceptance Criteria
- [ ] DB failure mid-enforcement => spine remains intact (no partial writes)
- [ ] Retention runner resumes idempotently after crash
- [ ] _[Clint to add additional criteria]_

### Exclusions
> _[Clint to fill]_

---

## L3-16 -- Structured Error Codes -- No Raw Exceptions

**Code area:** All `Keon.Verify.*` public surface
**Test:** `ErrorCodeRegistryTests.cs`
**Validation:** Every failure => `KEON_*` code

### Definition
> _[Clint to fill]_

### Rationale
> _[Clint to fill]_

### Acceptance Criteria
- [ ] Every public-surface failure emits a `KEON_*` structured error code
- [ ] No raw `Exception` message surfaces to callers from `Keon.Verify.*`
- [ ] Error code registry covers 100% of known failure modes
- [ ] _[Clint to add additional criteria]_

### Exclusions
> _[Clint to fill]_

---

## L3-17 -- Delegation Binding Target Mandatory

**Code area:** `DelegationChainValidator.cs`
**Test:** `DelegationChainTests.cs`
**Validation:** Missing `target_binding` => `KEON_DELEGATION_BINDING_MISSING`

### Definition
> _[Clint to fill]_

### Rationale
> _[Clint to fill]_

### Acceptance Criteria
- [ ] Missing `target_binding` field => `KEON_DELEGATION_BINDING_MISSING`
- [ ] Null `target_binding` => treated identically to missing (hard rejection)
- [ ] _[Clint to add additional criteria]_

### Exclusions
> _[Clint to fill]_
'@

Add-Content -Path $specPath -Value $part3 -Encoding UTF8
$lineCount = (Get-Content $specPath).Count
Write-Host "PART3 appended. Total lines: $lineCount"
Write-Host "STATUS: $(if ($lineCount -gt 100) { 'OK -- full spec written' } else { 'ERROR -- file too short' })"

