import 'server-only'
import { Prisma } from '@prisma/client'
import type {
  ActivationMode,
  ActivationSource,
  InviteToken,
  ProvisioningRun,
  ProvisioningState,
  Tenant,
  TenantMembership,
  User,
  Workspace,
} from '@prisma/client'
import crypto from 'node:crypto'
import { db } from './client'

// ─── Token Hashing ────────────────────────────────────────────────────────────
// Raw activation tokens are NEVER persisted. Only SHA-256 hash stored in
// ProvisioningRun.activationTokenHash. Validation of raw tokens happens in the
// route layer before this module is called.

function hashActivationToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex')
}

// ─── Safe Return Type ─────────────────────────────────────────────────────────
// activationTokenHash must not leave the DB layer. All exported functions that
// return a run use SafeProvisioningRun — the hash field is stripped at service
// boundaries. Route handlers must never serialize activationTokenHash to clients.

export type SafeProvisioningRun = Omit<ProvisioningRun, 'activationTokenHash'>

function sanitizeRun(run: ProvisioningRun): SafeProvisioningRun {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { activationTokenHash: _stripped, ...safe } = run
  return safe
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function generateExternalId(): string {
  return crypto.randomBytes(6).toString('hex') // 12-char lowercase hex
}

// ─── State History ────────────────────────────────────────────────────────────
// Append-only JSON array per ADR-0005 principle #8.
// Only state labels and timestamps are written — no tokens, no PII.

interface StateHistoryEvent {
  state: string
  timestamp: string
  error?: { code: string; message: string }
}

// ─── ActivationSource Reconciliation ─────────────────────────────────────────
// types.ts ActivationSource includes 'sandbox_fallback' which has no Prisma
// enum counterpart. Mapped to TEST_TOKEN — sandbox fallback always uses the
// internal test tenant (equivalent semantics). UI layer keeps the original label.

export type AppActivationSource = 'invite_token' | 'test_token' | 'sandbox_fallback'
export type AppActivationMode = 'invite' | 'test'

export function mapActivationSource(source: AppActivationSource): ActivationSource {
  switch (source) {
    case 'invite_token':  return 'INVITE_TOKEN'
    case 'test_token':    return 'TEST_TOKEN'
    case 'sandbox_fallback': return 'TEST_TOKEN'  // see note above
  }
}

export function mapActivationMode(mode: AppActivationMode): ActivationMode {
  return mode === 'invite' ? 'INVITE' : 'TEST'
}

// ─── Errors ───────────────────────────────────────────────────────────────────

export class ProvisioningRunNotFoundError extends Error {
  readonly runId: string
  constructor(runId: string) {
    super(`ProvisioningRun not found: ${runId}`)
    this.name = 'ProvisioningRunNotFoundError'
    this.runId = runId
  }
}

export class ProvisioningStateError extends Error {
  readonly runId: string
  readonly currentState: ProvisioningState
  constructor(message: string, runId: string, currentState: ProvisioningState) {
    super(message)
    this.name = 'ProvisioningStateError'
    this.runId = runId
    this.currentState = currentState
  }
}

// ─── startProvisioningRun ─────────────────────────────────────────────────────

export interface StartProvisioningRunInput {
  /**
   * Raw activation token. Hashed to SHA-256; never stored raw.
   * Used as the idempotency key via resolveActivationToken().
   */
  rawToken: string
  activationMode: ActivationMode
  activationSource: ActivationSource
  startedByEmail: string
  startedByName?: string
  /**
   * Pre-existing tenant ID. If supplied, the run attaches to it and skips
   * tenant + workspace creation (assumes they were set up out-of-band).
   * If omitted, all six records are created in the same transaction.
   */
  tenantId?: string
  tenantExternalId?: string
  tenantName?: string
}

export interface StartProvisioningRunResult {
  run: SafeProvisioningRun
  tenant: Tenant
  user: User
  membership: TenantMembership
  workspace: Workspace
  inviteToken: InviteToken
}

/**
 * Atomically provision a new tenant in a single db.$transaction:
 *   1. Tenant              — status: PROVISIONED
 *   2. User                — upsert by email
 *   3. TenantMembership    — OWNER / ACTIVE
 *   4. Workspace           — SANDBOX (TEST mode) or PRODUCTION (INVITE mode)
 *   5. ProvisioningRun     — state: PROVISIONING_COMPLETE / status: COMPLETED
 *   6. InviteToken         — SYSTEM-issued, 7-day expiry, single-use
 *
 * All six records land together or none do — no partial tenant state in the DB.
 * stateHistory records the full state progression as an audit trail so the GET
 * poll handler can replay the transitions for the UI checklist.
 *
 * Callers MUST call resolveActivationToken() first and return the existing run
 * if found — startProvisioningRun() does NOT re-check for duplicates internally.
 */
export async function startProvisioningRun(
  input: StartProvisioningRunInput,
): Promise<StartProvisioningRunResult> {
  const {
    rawToken,
    activationMode,
    activationSource,
    startedByEmail,
    startedByName,
    tenantId: existingTenantId,
    tenantExternalId,
    tenantName,
  } = input

  const activationTokenHash = hashActivationToken(rawToken)
  const now = new Date()
  const nowIso = now.toISOString()

  return db.$transaction(async (tx) => {
    // ── 1. Tenant ─────────────────────────────────────────────────────────────
    let tenant: Tenant

    if (existingTenantId) {
      const found = await tx.tenant.findUnique({ where: { id: existingTenantId } })
      if (!found) throw new Error(`Tenant not found: ${existingTenantId}`)
      tenant = found
    } else {
      tenant = await tx.tenant.create({
        data: {
          externalId: tenantExternalId ?? generateExternalId(),
          name: tenantName ?? startedByEmail.split('@')[0],
          status: 'PROVISIONING',
        },
      })
    }

    // ── 2. User (upsert) ──────────────────────────────────────────────────────
    const user = await tx.user.upsert({
      where: { email: startedByEmail },
      create: { email: startedByEmail, name: startedByName ?? null },
      update: startedByName ? { name: startedByName } : {},
    })

    // ── 3. TenantMembership (OWNER) ───────────────────────────────────────────
    // upsert: if an OWNER membership already exists (existing-tenant path), keep it
    const membership = await tx.tenantMembership.upsert({
      where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
      create: { tenantId: tenant.id, userId: user.id, role: 'OWNER', status: 'ACTIVE' },
      update: { role: 'OWNER', status: 'ACTIVE' },
    })

    // ── 4. Workspace ──────────────────────────────────────────────────────────
    // PRODUCTION workspaces must never be activated via a TEST token (ADR-0005).
    const environment = activationMode === 'TEST' ? 'SANDBOX' : 'PRODUCTION'
    const workspace = await tx.workspace.create({
      data: {
        tenantId: tenant.id,
        externalId: generateExternalId(),
        name: 'default',
        environment,
        onboardingStatus: 'NOT_STARTED',
      },
    })

    // ── 5. ProvisioningRun ────────────────────────────────────────────────────
    // stateHistory records the full progression as an audit trail.
    // Raw token and PII are intentionally absent from every history entry.
    const stateHistory: StateHistoryEvent[] = [
      { state: 'INVITE_VALIDATING',      timestamp: nowIso },
      { state: 'TENANT_RESOLVING',       timestamp: nowIso },
      { state: 'TENANT_CREATING',        timestamp: nowIso },
      { state: 'MEMBERSHIP_BINDING',     timestamp: nowIso },
      { state: 'WORKSPACE_BOOTSTRAPPING', timestamp: nowIso },
    ]

    const run = await tx.provisioningRun.create({
      data: {
        tenantId: tenant.id,
        activationMode,
        activationSource,
        startedByEmail,
        startedByName: startedByName ?? null,
        state: 'PROVISIONING_COMPLETE',
        status: 'COMPLETED',
        completedAt: now,
        activationTokenHash,
        stateHistory: stateHistory as unknown as Prisma.InputJsonValue,
      },
    })

    // ── 6. InviteToken (SYSTEM) ───────────────────────────────────────────────
    // Char(32): crypto.randomBytes(16).toString('hex') = exactly 32 hex chars.
    const inviteToken = await tx.inviteToken.create({
      data: {
        token: crypto.randomBytes(16).toString('hex'),
        tenantId: tenant.id,
        createdByKind: 'SYSTEM',
        inviteeEmail: startedByEmail,
        inviteeName: startedByName ?? null,
        roleToGrant: 'OWNER',
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        maxUses: 1,
        usesRemaining: 1,
      },
    })

    // ── Tenant → PROVISIONED ──────────────────────────────────────────────────
    const provisionedTenant = await tx.tenant.update({
      where: { id: tenant.id },
      data: { status: 'PROVISIONED', provisionedAt: now },
    })

    return {
      run: sanitizeRun(run),
      tenant: provisionedTenant,
      user,
      membership,
      workspace,
      inviteToken,
    }
  })
}

// ─── resolveActivationToken ───────────────────────────────────────────────────

/**
 * Find an existing ProvisioningRun by (rawToken, activationMode).
 * Uses the composite unique index on (activationTokenHash, activationMode).
 *
 * Returns SafeProvisioningRun — activationTokenHash is stripped before returning.
 * Returns null if no run exists for this token+mode combination.
 *
 * Always call this before startProvisioningRun() — return the existing run if
 * found (idempotent POST), call startProvisioningRun() only if null.
 */
export async function resolveActivationToken(
  rawToken: string,
  activationMode: ActivationMode,
): Promise<SafeProvisioningRun | null> {
  const activationTokenHash = hashActivationToken(rawToken)
  const run = await db.provisioningRun.findFirst({
    where: { activationTokenHash, activationMode },
  })
  return run ? sanitizeRun(run) : null
}

// ─── getProvisioningRun ───────────────────────────────────────────────────────

/**
 * Fetch a ProvisioningRun by ID. Returns SafeProvisioningRun (hash stripped).
 * Replaces sessions.get(provisioningId) in the in-memory Map (wired in KEO-10).
 */
export async function getProvisioningRun(id: string): Promise<SafeProvisioningRun | null> {
  const run = await db.provisioningRun.findUnique({ where: { id } })
  return run ? sanitizeRun(run) : null
}

// ─── advanceProvisioning ──────────────────────────────────────────────────────

/**
 * Advance a ProvisioningRun to a new state (pure record operation).
 * Useful for admin recovery, async sub-flows, or future partial-provisioning paths.
 * The happy path through startProvisioningRun() never calls this — it completes
 * atomically in one shot. Returns SafeProvisioningRun.
 */
export async function advanceProvisioning(
  runId: string,
  newState: ProvisioningState,
  error?: { code: string; message: string },
): Promise<SafeProvisioningRun> {
  const run = await db.provisioningRun.findUnique({ where: { id: runId } })
  if (!run) throw new ProvisioningRunNotFoundError(runId)

  if (run.status !== 'IN_PROGRESS') {
    throw new ProvisioningStateError(
      `Cannot advance a run that is not IN_PROGRESS (current status: ${run.status})`,
      runId,
      run.state,
    )
  }

  const history = (run.stateHistory as unknown as StateHistoryEvent[]) ?? []
  history.push({ state: run.state, timestamp: new Date().toISOString() })

  const isComplete = newState === 'PROVISIONING_COMPLETE'
  const isFailed   = newState === 'PROVISIONING_FAILED'

  const updated = await db.provisioningRun.update({
    where: { id: runId },
    data: {
      state: newState,
      stateHistory: history as unknown as Prisma.InputJsonValue,
      ...(isComplete && { status: 'COMPLETED', completedAt: new Date() }),
      ...(isFailed && {
        status: 'FAILED',
        failedAt: new Date(),
        failureCode: error?.code ?? 'UNKNOWN',
        failureMessage: error?.message ?? null,
      }),
    },
  })

  return sanitizeRun(updated)
}

// ─── failProvisioningRun ──────────────────────────────────────────────────────

/**
 * Convenience wrapper for PROVISIONING_FAILED. Enforces required error fields.
 * Returns SafeProvisioningRun.
 */
export async function failProvisioningRun(
  runId: string,
  code: string,
  message: string,
): Promise<SafeProvisioningRun> {
  return advanceProvisioning(runId, 'PROVISIONING_FAILED', { code, message })
}

// ─── bindFirstUser ────────────────────────────────────────────────────────────

export interface BindFirstUserResult {
  user: User
  membership: TenantMembership
  run: SafeProvisioningRun
}

/**
 * Upsert a User by email and create an OWNER TenantMembership for the run's
 * tenant, then advance run state to MEMBERSHIP_BINDING. All three writes are
 * transactional.
 *
 * In the happy path, startProvisioningRun() already creates User + Membership
 * atomically — this function exists for:
 *   - Invite-acceptance flows where a new user joins an existing tenant
 *   - Admin-initiated membership binding outside normal provisioning
 *   - Future async partial-provisioning recovery
 *
 * Throws if the run is not IN_PROGRESS, or if the tenant already has an OWNER.
 * Returns SafeProvisioningRun.
 */
export async function bindFirstUser(
  runId: string,
  email: string,
  name?: string,
): Promise<BindFirstUserResult> {
  const run = await db.provisioningRun.findUnique({ where: { id: runId } })
  if (!run) throw new ProvisioningRunNotFoundError(runId)

  if (run.status !== 'IN_PROGRESS') {
    throw new ProvisioningStateError(
      `Cannot bind user to a run that is not IN_PROGRESS (current status: ${run.status})`,
      runId,
      run.state,
    )
  }

  return db.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { email },
      create: { email, name: name ?? null },
      update: name ? { name } : {},
    })

    const existingOwner = await tx.tenantMembership.findFirst({
      where: { tenantId: run.tenantId, role: 'OWNER', status: 'ACTIVE' },
    })
    if (existingOwner) {
      throw new ProvisioningStateError(
        `Tenant ${run.tenantId} already has an active OWNER; cannot bind a second first user`,
        runId,
        run.state,
      )
    }

    const membership = await tx.tenantMembership.create({
      data: { tenantId: run.tenantId, userId: user.id, role: 'OWNER', status: 'ACTIVE' },
    })

    const history = (run.stateHistory as unknown as StateHistoryEvent[]) ?? []
    history.push({ state: run.state, timestamp: new Date().toISOString() })

    const updatedRun = await tx.provisioningRun.update({
      where: { id: runId },
      data: { state: 'MEMBERSHIP_BINDING', stateHistory: history as unknown as Prisma.InputJsonValue },
    })

    return { user, membership, run: sanitizeRun(updatedRun) }
  })
}
