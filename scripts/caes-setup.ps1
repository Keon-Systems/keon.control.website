#Requires -Version 5.1
# CAES Prep — GitHub Issue Infrastructure Setup
# Repo: Keon-Systems/keon-systems
# Run from: d:\Repos\keon-omega\keon-systems
# Creates: 5 milestones, 3 labels, 8 epic issues, 8 checklist issues

param([switch]$DryRun)

$ErrorActionPreference = "Stop"
$gh   = "C:\Program Files\GitHub CLI\gh.exe"
$repo = "Keon-Systems/keon-systems"

New-Item -ItemType Directory -Force -Path ".caes-plan" | Out-Null
$log = ".caes-plan\setup-output.txt"
"=== CAES Setup $(Get-Date -Format 'yyyy-MM-dd HH:mm') ===" | Tee-Object -FilePath $log

# ── helpers ────────────────────────────────────────────────────────────────────

function New-Milestone([string]$title, [string]$due, [string]$desc) {
    if ($DryRun) { Write-Host "DRY milestone: $title"; return 0 }
    $r = & $gh api "repos/$repo/milestones" --method POST `
        -f title=$title -f due_on="${due}T00:00:00Z" -f description=$desc 2>&1
    $obj = $r | ConvertFrom-Json -ErrorAction SilentlyContinue
    $n = if ($obj.number) { $obj.number } else { "ERR" }
    "  Milestone [$title] => #$n" | Tee-Object -Append -FilePath $log
    return [int]$obj.number
}

function Ensure-Label([string]$name, [string]$color, [string]$desc) {
    if ($DryRun) { Write-Host "DRY label: $name"; return }
    & $gh label create $name --repo $repo --color $color --description $desc 2>&1 | Out-Null
    "  Label [$name] ensured" | Tee-Object -Append -FilePath $log
}

function New-GhIssue([string]$title, [string]$body, [string]$labels, [string]$milestone) {
    if ($DryRun) { Write-Host "DRY issue: $title"; return 0 }
    $tmp = [IO.Path]::GetTempFileName()
    [IO.File]::WriteAllText($tmp, $body, [Text.Encoding]::UTF8)
    $a = @("issue","create","--repo",$repo,"--title",$title,"--body-file",$tmp,"--label",$labels)
    if ($milestone) { $a += @("--milestone", $milestone) }
    $r = & $gh @a 2>&1
    Remove-Item $tmp -Force -ErrorAction SilentlyContinue
    "  Issue [$title] => $r" | Tee-Object -Append -FilePath $log
    if ($r -match "issues/(\d+)") { return [int]$Matches[1] }
    return 0
}

# ── milestones ─────────────────────────────────────────────────────────────────

"`n-- Milestones --" | Tee-Object -Append -FilePath $log
$msW12   = New-Milestone "W1-W2"   "2026-03-14" "Phase 1: Lock Constitution Internally (Weeks 1-2)"
$msW35   = New-Milestone "W3-W5"   "2026-04-04" "Phase 2: Compliance Hardening (Weeks 3-5)"
$msW67   = New-Milestone "W6-W7"   "2026-04-18" "Phase 2: Compliance Hardening (Weeks 6-7)"
$msW810  = New-Milestone "W8-W10"  "2026-05-09" "Phase 3: Audit Surface + CLI + Evidence Pack (Weeks 8-10)"
$msW1112 = New-Milestone "W11-W12" "2026-05-23" "Phase 4: Enterprise Demo Readiness (Weeks 11-12)"

# ── labels ─────────────────────────────────────────────────────────────────────

"`n-- Labels --" | Tee-Object -Append -FilePath $log
Ensure-Label "epic"      "0052CC" "Epic tracking a CAES prep workstream"
Ensure-Label "checklist" "006B75" "Deliverable checklist for a workstream"
Ensure-Label "caes-prep" "5319E7" "Internal: CAES Level 3 preparation"

# ── epic issues ────────────────────────────────────────────────────────────────

"`n-- Epic Issues --" | Tee-Object -Append -FilePath $log

$bodyA = @'
## WS-A: Deterministic Canonicalization

**Lead repo:** `keon-systems/src/Keon.Canonicalization`
**Lead team:** Alpha (Claude Code)
**Milestone:** W3-W5

## Deliverables
- `PolicyHashCanonicalizer.cs` + determinism CI (Win + Linux)
- `PolicyEvaluationRecord` - first-class versioned canonical policy object
- Determinism vector library `CanonicalizationVectors/policy-*.json`
- `POLICY_HASH_SPEC.md`

## Exit Criteria
- CI platform matrix green (Win + Linux), RFC 8785 compliant
- 1000-run double-run byte-identical on all platform targets
- Zero `// TODO` in invariant paths

## Invariants Covered
L3-01 (Deterministic PolicyHash), L3-12 (PolicyHash in evidence pack)

## Blocks
WS-D (PolicyHash schema + manifest type)

---
*Daily progress format: MASTER_PLAN.md - Section H.2*
'@
$epicA = New-GhIssue "[EPIC] WS-A - Deterministic Canonicalization" $bodyA "epic,caes-prep" "W3-W5"

$epicB = New-GhIssue "[EPIC] WS-B — Spine Invariants" @'
## WS-B: Spine Invariants

**Lead repo:** `keon-systems/src/Keon.Runtime`
**Lead team:** Bravo (Grok)
**Milestone:** W3-W5

## Deliverables
- `SpineInvariantEnforcer.cs` — hard reject: duplicate, out-of-order, schema mismatch
- `SPINE_INVARIANT_ERROR_CODES.md`
- `SpineInvariantTests.cs`

## Exit Criteria
- Spine rejects with `KEON_SPINE_DUPLICATE_RECEIPT`, `KEON_SPINE_ORDER_VIOLATION`, `KEON_SPINE_VERSION_MISMATCH`
- Zero warning paths — hard failures only; DB-agnostic

## Invariants Covered
L3-02 (Append-only spine), L3-09 (No silent defaults)

## Blocks
WS-F (chaos injection needs spine rejection codes)

---
*Daily progress format: MASTER_PLAN.md §H.2*
'@ "epic,caes-prep" "W3-W5"

$epicC = New-GhIssue "[EPIC] WS-C — Trust Roots + Cryptographic Infrastructure" @'
## WS-C: Trust Roots + Cryptographic Infrastructure

**Lead repo:** `keon-systems/src/Keon.Verify`
**Lead team:** Alpha (Claude Code)
**Milestone:** W6-W7

## Deliverables
- `IKeyProvider.cs` interface + `DevKeyProvider.cs` stub (Phase 1, W1 — unblocks W3 start)
- KMS HSM provider wired behind `IKeyProvider` (W4)
- `DelegationChain.cs` with explicit binding target enforcement (W6)
- `DelegationChainVerifier.cs` (W6)
- `DelegationRevocationRegistry.cs` — append-only (W6)
- `TrustBundleExporter.cs` — self-contained bundle for air-gap (W7/W8)

## Exit Criteria
- HSM round-trip test green in CI
- Trust bundle exports and verifies offline
- Revoked/expired keys fail-closed (not fail-open)
- Missing `target_binding` → `KEON_DELEGATION_BINDING_MISSING` (hard reject)

## Invariants Covered
L3-03 (Signed Decision Receipts), L3-07 (Human Authority delegation), L3-11 (Trust bundle integrity)

## Blocks
WS-D (DelegationChain types), WS-H (base delegation types)

---
*Daily progress format: MASTER_PLAN.md §H.2*
'@ "epic,caes-prep" "W6-W7"

$epicD = New-GhIssue "[EPIC] WS-D — Evidence Pack Schema Extension" @'
## WS-D: Evidence Pack Schema Extension

**Lead repo:** `keon-systems/src/Keon.BundleWriter`
**Lead team:** Delta (Codex + Claude Code)
**Milestone:** W8-W10

## Deliverables
- `PolicyHashManifest` artifact type added to pack schema
- `DelegationChainArtifact` artifact type added to pack schema
- `ChaosTestAttestation` record type added to pack schema
- `evidence-pack-extension.schema.json` — CI-gated schema validation
- `EvidencePackExtensionTests.cs`

## Exit Criteria
- Pack passes JSON Schema; all 3 artifact types present and required for L3
- Two builds same scope → byte-identical ZIP
- Additive extension of v1 format (no v2 redesign unless absolutely required)
- Schema CI gate green on every BundleWriter PR

## Invariants Covered
L3-05 (Deterministic Evidence Pack), L3-08 (Audit-ready artifacts), L3-12, L3-13, L3-14

## Depends On
WS-A (PolicyHash types), WS-C (DelegationChain types), WS-F (ChaosTestAttestation type)

## Blocks
WS-E (CLI), WS-G (Python SDK)

---
*Daily progress format: MASTER_PLAN.md §H.2*
'@ "epic,caes-prep" "W8-W10"

$epicE = New-GhIssue "[EPIC] WS-E — CLI Validator" @'
## WS-E: CLI Validator

**Lead repo:** `keon-systems/src/Keon.Cli`
**Lead team:** Alpha (Claude Code)
**Milestone:** W8-W10

## Deliverables
- `keon export-pack` CLI command (W9)
- `keon verify-pack --profile l3` — external-facing L3 verifier (W10)
- `keon verify-pack --offline --bundle <path>` — zero-network mode (W10)
- Internal `keon verify-caes` dev command (W9, internal builds only)
- Verification report: structured JSON, per-invariant pass/fail (W10)
- `VERIFY_L3_OUTPUT_SPEC.md`

## Exit Criteria
- Air-gap test passes (Wireshark: zero outbound packets)
- Zero "CAES" string in public binary (`caes-string-scan` CI check required)
- `offline-network-guard` CI check required
- Tampered pack → structured non-zero exit + JSON report
- Valid pack → exit 0

## Invariants Covered
L3-06 (Offline verification), L3-16 (Structured error codes)

## Depends On
WS-D (Evidence Pack schema)

## Blocks
WS-G (Python SDK wraps CLI logic)

---
*Daily progress format: MASTER_PLAN.md §H.2*
'@ "epic,caes-prep" "W8-W10"

$epicF = New-GhIssue "[EPIC] WS-F — Chaos & Fail-Closed Testing" @'
## WS-F: Chaos & Fail-Closed Testing

**Lead repo:** `keon-systems/tests/Keon.Integration.Tests`
**Lead team:** Bravo (Grok)
**Milestone:** W6-W7

## Deliverables
- `ChaosHarness.cs` — injectable failure modes, container-isolated
- 8 chaos scenarios (C1–C8) with documented exit codes
- `ChaosTestAttestation` record type

## Chaos Scenarios
| # | Failure | Expected Code |
|---|---|---|
| C1 | DB write failure mid-receipt | `KEON_SPINE_WRITE_FAILED` |
| C2 | Key rotation while signing in-flight | `KEON_KEY_ROTATION_CONFLICT` |
| C3 | Clock skew beyond tolerance | `KEON_TEMPORAL_CLOCK_SKEW_EXCEEDED` |
| C4 | Network partition during pack export | `KEON_PACK_INCOMPLETE` |
| C5 | Disk full during ZIP write | Deterministic error, no corrupt pack |
| C6 | Duplicate receipt injection | `KEON_SPINE_DUPLICATE_RECEIPT` |
| C7 | PolicyHash mismatch in receipt | `KEON_POLICY_HASH_MISMATCH` |
| C8 | DelegationChain expiry during verification | `KEON_DELEGATION_EXPIRED` |

## Exit Criteria
- All 8 scenarios: documented exit code, zero silent pass, zero state corruption, CI-gated
- Post-chaos: non-chaos suite remains green
- `chaos-isolation` required status check

## Invariants Covered
L3-04 (Fail-closed under chaos), L3-15 (Retention enforcement survives chaos)

---
*Daily progress format: MASTER_PLAN.md §H.2*
'@ "epic,caes-prep" "W6-W7"

$epicG = New-GhIssue "[EPIC] WS-G — DX / Python SDK / MCP" @'
## WS-G: DX / Python SDK / MCP

**Lead repo:** `keon-sdk-python/src/`
**Lead team:** Delta (Codex + Claude Code)
**Milestone:** W8-W10

## Scope
Verifier-only. No runtime, no decision engine.

## Deliverables
- `keon_sdk/verify.py` — `verify_caes()` function
- `keon_sdk/evidence_pack.py` — `EvidencePack.load()`
- `keon_sdk/receipt.py` — `DecisionReceipt.verify()`
- MCP server tools: `verify_pack`, `export_pack`, `check_l3_compliance`
- SDK quickstart committed

## Exit Criteria
- `pip install keon-sdk && python -c "from keon_sdk import verify_caes; print(verify_caes('pack.zip'))"` works offline
- Verifier-only scope enforced; Delta lead rejects non-verifier PRs
- Structured per-invariant result returned

## Invariants Covered
L3-06 (Offline verification — Python surface)

## Depends On
WS-E (CLI logic)

---
*Daily progress format: MASTER_PLAN.md §H.2*
'@ "epic,caes-prep" "W8-W10"

$epicH = New-GhIssue "[EPIC] WS-H — Human Authority Delegation Model" @'
## WS-H: Human Authority Delegation Model

**Lead repo:** `keon-systems/src/Keon.Verify`
**Lead team:** Charlie (Gemini)
**Milestone:** W6-W7

## Deliverables
- Delegation binding payload enforced (all mandatory fields including `target_binding`)
- All 6 error codes implemented and tested
- `DelegationProofReceipt` committed to spine on valid chain
- Fuzz test: 10K malformed chains, all 6 codes triggered

## Error Codes
| Condition | Code |
|---|---|
| Expired | `KEON_DELEGATION_EXPIRED` |
| Revoked | `KEON_DELEGATION_REVOKED` |
| Scope mismatch | `KEON_DELEGATION_SCOPE_VIOLATION` |
| Missing binding | `KEON_DELEGATION_BINDING_MISSING` |
| Binding mismatch | `KEON_DELEGATION_BINDING_MISMATCH` |
| Invalid signature | `KEON_DELEGATION_SIG_INVALID` |

## Exit Criteria
- Broad delegation without explicit `target_binding` → hard reject (not warning)
- All 6 error codes have dedicated tests; CI green
- Crypto review by Alpha team posted as comment

## Invariants Covered
L3-07 (Human Authority delegation + binding), L3-17 (Delegation binding target mandatory)

## Depends On
WS-C (base delegation types and `DelegationChainVerifier`)

---
*Daily progress format: MASTER_PLAN.md §H.2*
'@ "epic,caes-prep" "W6-W7"

"`nEpics: A=$epicA B=$epicB C=$epicC D=$epicD E=$epicE F=$epicF G=$epicG H=$epicH" | Tee-Object -Append -FilePath $log

# ── checklist issues ───────────────────────────────────────────────────────────

"`n-- Checklist Issues --" | Tee-Object -Append -FilePath $log

New-GhIssue "[CHECKLIST] WS-A — Deterministic Canonicalization" "Epic: #$epicA

## Deliverables
- [ ] ``PolicyHashCanonicalizer.cs`` implemented — RFC 8785 compliant
- [ ] Platform CI matrix configured (Win + Linux)
- [ ] 1000-run determinism test passing byte-identical
- [ ] ``PolicyEvaluationRecord`` first-class versioned schema committed
- [ ] Determinism vector library ``CanonicalizationVectors/policy-*.json`` complete
- [ ] ``POLICY_HASH_SPEC.md`` committed to main
- [ ] Zero ``// TODO`` in canonicalization invariant paths

## Exit Criteria
- [ ] CI platform matrix green Win + Linux confirmed
- [ ] Tag ``caes-prep-ws-a-v0.1`` created and pushed
- [ ] WS-D lead acceptance comment posted on hand-off PR
- [ ] All merged PRs linked in this checklist

**Progress: __% to exit criteria** (update Mon + Thu)" "checklist,caes-prep" "W3-W5"

New-GhIssue "[CHECKLIST] WS-B — Spine Invariants" "Epic: #$epicB

## Deliverables
- [ ] ``SpineInvariantEnforcer.cs`` skeleton with 3 hard-reject paths
- [ ] ``KEON_SPINE_DUPLICATE_RECEIPT`` tested — hard reject, no silent pass
- [ ] ``KEON_SPINE_ORDER_VIOLATION`` tested — hard reject
- [ ] ``KEON_SPINE_VERSION_MISMATCH`` tested — hard reject
- [ ] ``SpineInvariantTests.cs`` — all 3 rejection codes covered
- [ ] ``SPINE_INVARIANT_ERROR_CODES.md`` committed
- [ ] DB-agnostic: no SQLite-only escape hatch
- [ ] Zero warning paths verified in CI

## Exit Criteria
- [ ] Tag ``caes-prep-ws-b-v0.1`` created and pushed
- [ ] WS-F lead acceptance comment posted on hand-off PR
- [ ] All merged PRs linked in this checklist

**Progress: __% to exit criteria** (update Mon + Thu)" "checklist,caes-prep" "W3-W5"

New-GhIssue "[CHECKLIST] WS-C — Trust Roots + Cryptographic Infrastructure" "Epic: #$epicC

## Deliverables
- [ ] ``IKeyProvider.cs`` interface committed (W1 — prerequisite for WS-C start W3)
- [ ] ``DevKeyProvider.cs`` stub merged (enables dev-key-only start at W3)
- [ ] KMS HSM provider wired behind ``IKeyProvider`` (W4)
- [ ] HSM round-trip test passing in CI
- [ ] ``DelegationChain.cs`` with explicit ``target_binding`` enforcement
- [ ] ``DelegationChainVerifier.cs`` — ``KEON_DELEGATION_BINDING_MISSING`` on missing target
- [ ] ``DelegationRevocationRegistry.cs`` append-only committed
- [ ] ``TrustBundleExporter.cs`` — self-contained bundle for air-gap (W7/W8)
- [ ] Revoked key → hard reject; expired key → hard reject

## Exit Criteria
- [ ] HSM round-trip test green in CI
- [ ] Trust bundle offline verify confirmed
- [ ] Tag ``caes-prep-ws-c-delegation-v0.1`` created and pushed
- [ ] WS-D lead + WS-H lead acceptance comments posted
- [ ] All merged PRs linked in this checklist

**Progress: __% to exit criteria** (update Mon + Thu)" "checklist,caes-prep" "W6-W7"

New-GhIssue "[CHECKLIST] WS-D — Evidence Pack Schema Extension" "Epic: #$epicD

## Deliverables
- [ ] Schema field list approved by Clint (prerequisite gate)
- [ ] ``PolicyHashManifest`` artifact type in pack schema
- [ ] ``DelegationChainArtifact`` artifact type in pack schema
- [ ] ``ChaosTestAttestation`` artifact type in pack schema
- [ ] ``evidence-pack-extension.schema.json`` committed and CI-gated
- [ ] ``EvidencePackExtensionTests.cs`` — all 3 artifact types present + required
- [ ] Pack passes JSON Schema validation in CI
- [ ] Two builds same scope → byte-identical ZIP confirmed
- [ ] Additive v1 extension (no v2 redesign unless JSON Schema strict requires it)

## Exit Criteria
- [ ] Schema CI gate green on every BundleWriter PR
- [ ] Tag ``caes-prep-pack-ext-schema-v0.1`` created and pushed
- [ ] WS-E lead + WS-G lead acceptance comments posted
- [ ] All merged PRs linked in this checklist

**Progress: __% to exit criteria** (update Mon + Thu)" "checklist,caes-prep" "W8-W10"

New-GhIssue "[CHECKLIST] WS-E — CLI Validator" "Epic: #$epicE

## Deliverables
- [ ] ``keon export-pack`` command implemented and tested (W9)
- [ ] ``keon verify-pack --profile l3`` — external L3 verifier (W10)
- [ ] ``keon verify-pack --offline --bundle <path>`` — zero-network mode (W10)
- [ ] Internal ``keon verify-caes`` dev command (W9, NOT in public binary)
- [ ] Verification report: structured JSON per-invariant pass/fail (W10)
- [ ] ``VERIFY_L3_OUTPUT_SPEC.md`` committed
- [ ] ``caes-string-scan`` CI check: zero CAES in public binary output/help text
- [ ] ``offline-network-guard`` CI check: configured and passing
- [ ] Air-gap test: Wireshark confirms zero outbound packets
- [ ] Tampered pack → non-zero exit + structured JSON

## Exit Criteria
- [ ] Air-gap test green on clean runner
- [ ] Tag ``caes-prep-ws-e-verify-l3-v0.1`` created and pushed
- [ ] WS-G lead acceptance comment posted on hand-off PR
- [ ] All merged PRs linked in this checklist

**Progress: __% to exit criteria** (update Mon + Thu)" "checklist,caes-prep" "W8-W10"

New-GhIssue "[CHECKLIST] WS-F — Chaos & Fail-Closed Testing" "Epic: #$epicF

## Deliverables
- [ ] ``ChaosHarness.cs`` — container-isolated injectable failure infrastructure
- [ ] C1: DB write failure mid-receipt → ``KEON_SPINE_WRITE_FAILED``
- [ ] C2: Key rotation while signing in-flight → ``KEON_KEY_ROTATION_CONFLICT``
- [ ] C3: Clock skew beyond tolerance → ``KEON_TEMPORAL_CLOCK_SKEW_EXCEEDED``
- [ ] C4: Network partition during pack export → ``KEON_PACK_INCOMPLETE``
- [ ] C5: Disk full during ZIP write → deterministic error, no corrupt pack
- [ ] C6: Duplicate receipt injection → ``KEON_SPINE_DUPLICATE_RECEIPT``
- [ ] C7: PolicyHash mismatch in receipt → ``KEON_POLICY_HASH_MISMATCH``
- [ ] C8: DelegationChain expiry → ``KEON_DELEGATION_EXPIRED``
- [ ] ``ChaosTestAttestation`` record type committed
- [ ] All 8: zero silent pass, zero state corruption, CI-gated
- [ ] Post-chaos: non-chaos suite still green

## Exit Criteria
- [ ] ``chaos-isolation`` required status check green
- [ ] Tag ``caes-prep-ws-f-v0.1`` created and pushed
- [ ] All merged PRs linked in this checklist

**Progress: __% to exit criteria** (update Mon + Thu)" "checklist,caes-prep" "W6-W7"

New-GhIssue "[CHECKLIST] WS-G — DX / Python SDK / MCP" "Epic: #$epicG

## Deliverables
- [ ] Python package scaffold (``keon_sdk/``) initialized
- [ ] ``keon_sdk/verify.py`` — ``verify_caes()`` returning structured per-invariant result
- [ ] ``keon_sdk/evidence_pack.py`` — ``EvidencePack.load()``
- [ ] ``keon_sdk/receipt.py`` — ``DecisionReceipt.verify()``
- [ ] MCP server tools: ``verify_pack``, ``export_pack``, ``check_l3_compliance``
- [ ] Offline verification confirmed: zero network dependency
- [ ] Verifier-only scope: Delta lead rejects any non-verifier PRs
- [ ] SDK quickstart committed to keon-sdk-python README

## Exit Criteria
- [ ] ``pip install keon-sdk`` + offline quickstart passes on clean machine
- [ ] Verifier-only scope confirmed by Delta lead review
- [ ] All merged PRs linked in this checklist

**Progress: __% to exit criteria** (update Mon + Thu)" "checklist,caes-prep" "W8-W10"

New-GhIssue "[CHECKLIST] WS-H — Human Authority Delegation Model" "Epic: #$epicH

## Deliverables
- [ ] Delegation binding payload all mandatory fields enforced
- [ ] ``KEON_DELEGATION_EXPIRED`` — dedicated test
- [ ] ``KEON_DELEGATION_REVOKED`` — dedicated test
- [ ] ``KEON_DELEGATION_SCOPE_VIOLATION`` — dedicated test
- [ ] ``KEON_DELEGATION_BINDING_MISSING`` — hard reject, dedicated test
- [ ] ``KEON_DELEGATION_BINDING_MISMATCH`` — dedicated test
- [ ] ``KEON_DELEGATION_SIG_INVALID`` — dedicated test
- [ ] ``DelegationProofReceipt`` committed to spine on valid chain
- [ ] Fuzz test: 10K malformed chains, all 6 codes triggered in CI

## Exit Criteria
- [ ] All 6 error codes have dedicated tests, CI green
- [ ] Broad delegation without ``target_binding`` = hard reject confirmed
- [ ] Alpha team crypto review comment posted
- [ ] Tag ``caes-prep-ws-h-v0.1`` created and pushed
- [ ] All merged PRs linked in this checklist

**Progress: __% to exit criteria** (update Mon + Thu)" "checklist,caes-prep" "W6-W7"

"`n=== Setup Complete ===" | Tee-Object -Append -FilePath $log
Get-Content $log

