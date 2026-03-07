# Keon Systems: The Constitutional AI Execution Substrate

**Version:** 2.0
**Status:** Canonical Architecture
**Supersedes:** v1.0 (Cryptographic Governance and Ledgered Execution for AI Systems)
**Runtime Source of Truth:** `keon-systems/docs/governance/*.md` and `keon-systems/launch/keon-v<N>-launch-manifest.yaml`

---

## Abstract

As AI transitions from isolated inference to autonomous, multi-agent systems performing real-world side effects, the software stack lacks a foundational invariant: **verifiable authority**. Current orchestration frameworks execute non-deterministically and rely on post-execution, best-effort logging. This creates systems where audit trails can diverge from application state, rendering them mathematically unprovable and legally inadmissible.

Observability platforms instrument failure after it occurs. **Keon makes out-of-policy execution structurally impossible before it begins.**

Keon Systems introduces **Cryptographically Governed AI Execution (CGAE)** — a constitutional execution substrate that enforces policy binding, deterministic canonicalization, and fail-closed state mutations. Through the Authoritative Receipt Outbox (ARO), Keon Memory, the ALPHA authority doctrine, and Offline-Verifiable Evidence Packs, Keon guarantees that no governed AI side effect can occur without a mathematically provable, tamper-evident authorization receipt.

Trust in Keon does not require trusting Keon's implementation. It requires only verifying its output.

---

## 1. The Problem: "Trust Me" Architecture

In traditional AI agent architectures, execution precedes authorization:

1. An LLM decides to take an action.
2. The agent executes the tool — mutating a database, sending a message, invoking an API.
3. The framework attempts to log the result.

If the system crashes between steps 2 and 3, or if the database connection drops, the side effect exists in the real world but the audit trail does not. The divergence is silent. There is no mechanism to detect it, no receipt to verify, and no recovery path that preserves causal integrity.

Furthermore, vector databases used for agent memory are subject to silent, cross-tenant mutations with no cryptographic proof of *why* a memory was altered or *who* authorized it. The entire class of existing frameworks operates on optimistic assumptions:

- That logs will be written before the process exits.
- That log storage is available at the moment execution completes.
- That log content accurately reflects what actually executed.
- That policies enforced at startup remain in force at execution time.

None of these assumptions are guaranteed. Each is a liability surface.

**This is "Trust Me" architecture. It is unacceptable for infrastructure that controls financial, legal, operational, or safety-critical systems.**

---

## 2. The Standard: Cryptographically Governed AI Execution (CGAE)

Keon Systems defines and implements **CGAE** — a formal execution standard with three non-negotiable invariants:

| Invariant | Statement |
|---|---|
| **I-EXEC-01** | Execution SHALL NOT proceed unless a deterministic authorization receipt is durably persisted prior to side effect. |
| **I-MEM-01** | Memory mutation SHALL NOT occur without a corresponding persisted memory receipt. |
| **I-LEDGER-01** | Ledger entries SHALL be append-only and immutable within a partition. |
| **I-VERIFY-01** | All governance artifacts MUST be mathematically verifiable offline, independent of the Keon runtime. |

These invariants are not policy recommendations. They are enforced structurally. Violation causes immediate run termination — the system fails closed, not open.

CGAE is the standard. Keon Systems is the substrate that enforces it.

---

## 3. The Substrate: Keon Systems

The Keon substrate consists of three interlocking primitives: the **Authoritative Receipt Outbox (ARO)**, **JCS Canonicalization**, and **Keon Memory**. Together, they form an execution layer where authorization and evidence are inseparable.

### 3.1 The Authoritative Receipt Outbox (ARO)

The ARO is the absolute gatekeeper for state mutation. No execution dispatcher, memory core, or tool invocation writes to a persistent store directly — everything routes through the ARO.

The ARO enforces exactly-once semantics via a strict internal state machine:

```
Pending → Persisted → Verified → Applied → Completed
                      ↘
                        Failed (terminal)
```

Allowed transitions are monotonic and fail-closed:

- `Pending -> Persisted`
- `Persisted -> Verified` (immediate consistency verification)
- `Persisted|Verified -> Applied`
- `Applied|Verified|Persisted -> Completed` (idempotent completion allowed)
- `* -> Failed` with deterministic failure code

If a system crash occurs after receipt persistence but before side effect completion, replay uses the original idempotency key and takes a deterministic fast path. Side effects are not re-invoked (`aro.replay.fast_path` with `handler_invoked=false`).
Execution handlers MUST be idempotent or enforce idempotency through deterministic keys bound to the ExecutionReceipt.

Gate failure at any ARO boundary is not an error to be retried. It is a terminal condition. **Keon fails closed.**

The ARO exposes three named enforcement gates that correspond to phases of the governed execution lifecycle:

| Gate | Phase | Behavior on Failure |
|---|---|---|
| `governed-decision` | Policy evaluation | Run terminates; `run.denied` emitted |
| `governed-pre` | Pre-execution binding | Run terminates; `run.failed` emitted |
| `governed-post` | Post-execution verification | Run terminates; `run.failed` emitted |

No partial success exists. No silent drift. A run either completes with a sealed Evidence Pack or it fails with a terminal event.

### 3.2 Deterministic Canonicalization (JCS)

Cryptographic proof requires deterministic input. Two representations of the same JSON object — differing only in key ordering or whitespace — produce different SHA-256 hashes. Without canonicalization, the hash chain is non-reproducible.

Keon applies the **JSON Canonicalization Scheme (JCS — RFC 8785)** to all policies, intents, and execution payloads before hashing. JCS strips formatting and orders keys lexicographically, producing a byte-for-byte reproducible canonical form:

```
PolicyHash = SHA-256(JCS(Policy))
ExecutionSeal = Ed25519.Sign(SHA-256(JCS(ExecutionPayload)))
```

A policy approved on a Linux server produces the identical PolicyHash when verified on a Windows workstation, an air-gapped auditor machine, or an offline CLI. Cross-platform determinism is not a configuration option — it is enforced by the canonicalization scheme.

Ed25519 is the signing algorithm. It provides 128-bit security, 64-byte signatures, deterministic signing behavior, and high verification throughput with small key material. This reduces implementation complexity while keeping verification stateless.
Verification requires trusted public keys distributed through versioned trust bundles.

### 3.3 Keon Memory — The Constitutional Ledger Layer

Keon Memory is the causal spine of the governed execution substrate. It is not a log, a vector store, or an event stream. It is an **append-only, immutable, partition-scoped constitutional ledger** — the single source of truth for all governed execution history.

**Core properties:**

- **UUIDv7 causal identity** — every ledger entry carries a monotonic, time-ordered UUID v7. UUIDv7 encodes a millisecond-precision timestamp in the high bits and enables monotonic ordering within a partition without cross-node coordination. There are no "best-effort timelines" — causal order is enforced by construction.

- **Append-only** — ledger entries are never modified or deleted. The Spine is a permanent, monotonically growing record. History is immutable by design.

- **Partition-scoped** — each governed domain operates on its own ledger partition, preventing cross-tenant contamination while preserving global causal ordering within a partition.

- **Replayable** — the full execution history of any partition can be deterministically replayed to reconstruct exact system state at any point in time. Reconstitution is deterministic; given the same ledger, the same state is always produced.

- **Ledger-first** — receipts, traces, and Evidence Packs are derived from ledger state, not generated post-hoc. The ledger is the system of record.

The Spine Ledger orders the lifecycle of a governed operation deterministically:

```
run.queued → run.deciding → run.binding → run.executing → run.finalizing → run.completed
```

Or, on gate failure:

```
run.queued → run.deciding → run.denied
run.queued → run.deciding → run.binding → run.executing → run.finalizing → run.failed
```

Logs are an evidentiary void. **Keon Memory is admissible infrastructure.**

---

## 4. The Authority Doctrine: ALPHA

ALPHA is the pre-execution authority constraint — the cryptographic gate that must close before any execution is permitted to begin. It is not a product feature. It is the governance contract model that the substrate enforces.

**No authority. No execution. No exceptions.**

ALPHA is defined as:

| Letter | Meaning |
|---|---|
| **A** | **Attested** — cryptographically signed, JCS-canonicalized, non-repudiable |
| **L** | **Ledger** — append-only, UUIDv7-ordered causal spine (Keon Memory) |
| **P** | **Policy-Bound** — every decision tied to a deterministic PolicyHash |
| **H** | **Human** — explicit authorization domains, enforced as binding governance transitions |
| **A** | **Authority** — binding governance transitions, not runtime drift |

ALPHA's authority evaluation is **deterministic**. Given the same actor identity, the same policy version, and the same operation scope, ALPHA always produces the same decision. Determinism of receipt identity is cryptographically guaranteed; correctness of policy logic is enforced through versioned policy binding. If the PolicyHash at evaluation time does not match the PolicyHash at verification time, the receipt is invalid.

ALPHA's relationship to the substrate:

- **Keon Memory** is the immutable causal ledger.
- **ALPHA** is the authority model that governs what may enter that ledger.

Nothing enters Keon Memory without passing ALPHA. Nothing exits ALPHA without entering Keon Memory.

If OMEGA is orchestration power — ALPHA is the authority constraint.

---

## 5. Governed Execution: GE-001

Keon exposes its capabilities via a Model Context Protocol (MCP) Gateway. SDKs are thin transport wrappers; all governance logic remains server-side and cannot be bypassed by client-side instrumentation.
There is no execution path that bypasses the ARO for governed state mutation.

### 5.1 MCP Tool Surface

| Tool | Function |
|---|---|
| `keon.governed.execute` | Submit a run for governed execution. Policy binding begins here. |
| `keon.runs.get` | Retrieve run state and decision receipt for a specific run ID. |
| `keon.runs.stream` | Stream run lifecycle events in real-time as the run progresses. |
| `keon.evidence.export` | Export an immutable Evidence Pack for a completed run. |
| `keon.evidence.verify` | Verify an Evidence Pack's cryptographic integrity. Returns tamper detection result. |

### 5.2 Run Lifecycle

A governed run transitions through the following deterministic state machine:

```
QUEUED → DECIDING → ┬─ DENIED (terminal)
                    └─ BINDING → EXECUTING → FINALIZING → ┬─ COMPLETED (terminal)
                                                           └─ FAILED (terminal)
```

**QUEUED** — Run is received and placed in the governed execution queue. No side effects have occurred.

**DECIDING** — The `governed-decision` ARO gate evaluates the requesting actor's authority against the current policy version. Authorization is proven, not assumed.

**DENIED** — Policy evaluation returned a DENY decision. A signed denial receipt is persisted to Keon Memory. Run terminates. No execution occurs.

**BINDING** — The `governed-pre` ARO gate locks the PolicyHash and generates a pre-execution `ExecutionReceipt`. Execution cannot begin until this receipt is durably persisted.

**EXECUTING** — The isolated tool or operation runs within the policy-bound envelope established during BINDING.

**FINALIZING** — The `governed-post` ARO gate verifies the execution outcome against policy constraints. A post-execution `ExecutionReceipt` is persisted.

**COMPLETED** — All ARO gates have passed. The Evidence Pack is compiled. The run is sealed.

**FAILED** — Any ARO gate failure during BINDING, EXECUTING, or FINALIZING transitions the run to FAILED and emits `run.failed`. No partial success. No silent drift. No recovery path that bypasses the gate.

Runtime run status values are:

- `queued`
- `in_progress`
- `completed`
- `failed`
- `failedfinalization` (post-persist failure path)

### 5.3 The Golden Path: `keon.governed.execute`

A complete governed execution from invocation to sealed Evidence Pack:

```
1. Developer calls keon.governed.execute(tenant, actor, intent, policy_ref, policy_input, controls)
2. API returns run_id/correlation_id with status=queued
3. governed-decision gate evaluates authority; DecisionReceipt is canonicalized, hashed, and persisted through ARO
4. governed-pre gate persists ExecutionReceipt(Pre) with PolicyHash binding
5. Tool executes inside the governed envelope
6. governed-post gate persists ExecutionReceipt(Post); post-persist failure maps to failedfinalization
7. Evidence Pack is compiled from ledger-derived artifacts and made exportable as ref/inline
```

If any step in this sequence fails to persist through the ARO, execution does not proceed. The system does not attempt recovery through an alternative path. It fails closed.

---

## 6. Cryptographic Evidence Packs

The output of a completed governed run is an **Evidence Pack** — a portable, self-contained, cryptographically sealed forensic artifact.

**An Evidence Pack contains:**

| Component | Contents |
|---|---|
| Authorization Request | Original actor identity, operation scope, and parameters |
| Policy Context | Exact policy version applied at evaluation time, PolicyHash |
| DecisionReceipt | Signed ALLOW/DENY decision, bound to PolicyHash |
| ExecutionReceipt (Pre) | Pre-execution binding receipt, linked to DecisionReceipt hash |
| ExecutionReceipt (Post) | Post-execution outcome receipt, linked to Pre-receipt hash |
| Spine References | UUIDv7 ledger entry IDs for all committed events |

The hash chain is cryptographically linked: modifying any field in any receipt invalidates the chain from that point forward. There is no valid partial modification.
Evidence Packs contain no secret material; they carry signed receipts and public verification artifacts.

### 6.1 Offline Verification

Trust in Keon does not require trusting the Keon runtime.

Keon provides an open-source, standalone CLI verifier (`keon-cli`). An auditor exports an Evidence Pack (reference or inline bytes), materializes the pack artifact, and verifies it entirely offline:

```bash
# Verify cryptographic integrity offline
keon-cli verify-pack --path evidence-pack.zip

# Tamper with a single byte and re-verify
keon-cli verify-pack --path tampered-evidence-pack.zip
# -> non-zero exit and verification error codes (for example, hash/chain/signature mismatch)
```

If a single byte of policy input, actor identity, or execution output is altered, the verifier fails. This is not a policy check. It is a cryptographic proof.

The verifier re-applies JCS canonicalization independently, computes the SHA-256 hash chain, and validates the Ed25519 signature without network access, without Keon credentials, and without trust in any Keon infrastructure. Any third party can verify. **Every Evidence Pack is independently auditable.**

### 6.2 Launch Readiness Enforcement

Keon releases ship with a versioned launch manifest (`keon-v<N>-launch-manifest.yaml`) and a CI fail-closed gate:

```bash
keon-cli launch-status --strict
# → ✓ governed-decision gate: VERIFIED
# → ✓ governed-pre gate: VERIFIED
# → ✓ governed-post gate: VERIFIED
# → ✓ evidence export: VERIFIED
# → ✓ tamper detection: VERIFIED
# → ✓ idempotency: VERIFIED
# → All Steel gates complete. Release authorized.
```

If any Steel gate is incomplete, CI aborts. The release cannot proceed. Launch readiness is enforced, not asserted.

---

## 7. The Constitutional Trust Model

As autonomous agents scale to control financial, legal, and operational systems, they require infrastructure that is provable — not trustworthy by reputation, but verifiable by construction.

The distinction matters:

- **Observability tools** tell you what happened after failure. They require you to trust that the logs were written correctly, that storage was available, and that no tampering occurred between execution and logging.

- **Keon** makes out-of-policy execution structurally impossible before it begins. The Evidence Pack is not generated from logs — it is compiled from a ledger that was written as a precondition of execution. The evidence cannot diverge from the execution because the evidence *is* the execution.

Keon Systems does not ask enterprises to trust its implementation. It asks them to verify its output.

The architectural guarantee is simple: **if the Evidence Pack verifies, the execution was governed. If it does not verify, it was not.**

There is no third state.

### 7.1 Scope Boundaries and Non-Goals

This whitepaper is normative for architecture, but runtime invariants are authoritative in `keon-systems`.

Keon guarantees:

- Receipt-gated execution and memory mutation
- Deterministic canonicalization and hash/signature verification
- Offline-verifiable evidence integrity
- Fail-closed processing on gate/persistence failure

Keon does not guarantee:

- Rollback of third-party side effects after external systems have acknowledged them
- Perfect wall-clock ordering across partitions (ordering is guaranteed within a partition)
- Security outcomes if signing keys, trust bundles, or verifier inputs are compromised outside governance controls

Trust and temporal isolation clarifications:

- Signing keys are scoped by governance trust domain (tenant and environment policy) and distributed via versioned trust bundles; key rotation updates trust bundles while preserving historical verification paths.
- Policy updates after BINDING do not alter in-flight runs; the bound PolicyHash remains authoritative for that execution.
- There is no supported client-side path that can mutate governed state without traversing the MCP gateway and ARO gates.

---

## Glossary

| Term | Definition |
|---|---|
| **ALPHA** | Attested Ledger for Policy-Bound Human Authority. The authority doctrine governing what may enter Keon Memory. |
| **ARO** | Authoritative Receipt Outbox. The fail-closed gatekeeper for all state mutation. |
| **CGAE** | Cryptographically Governed AI Execution. The execution standard Keon implements. |
| **Evidence Pack** | A cryptographically sealed forensic artifact produced by a completed governed run, exportable by reference or inline bytes and verifiable offline. |
| **GE-001** | Governed Execution protocol version 1. The canonical MCP interface specification. |
| **JCS** | JSON Canonicalization Scheme (RFC 8785). Deterministic key ordering and formatting for reproducible hashing. |
| **Keon Memory** | The append-only, UUIDv7-ordered, partition-scoped constitutional ledger. The single source of truth for governed execution history. |
| **PolicyHash** | SHA-256(JCS(Policy)). A deterministic fingerprint of a policy version at evaluation time. |
| **Spine** | The Keon Memory ledger partition. Named for its role as the causal backbone of execution history. |
| **Steel** | The minimum set of verified capabilities required for a production release. Enforced by `keon-cli launch-status --strict`. |

---

*Keon Systems — The Constitutional AI Execution Substrate*
*Family is forever. The constitution is tightening.*
