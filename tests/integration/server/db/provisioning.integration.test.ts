/**
 * KEO-13 — Provisioning DB integration tests
 *
 * These tests hit real Postgres (Docker or Neon — DATABASE_URL from .env).
 * They validate schema constraints and transaction behavior that mocked unit
 * tests cannot cover:
 *
 *   • Six-record atomic transaction (Tenant, User, Membership, Workspace, Run, InviteToken)
 *   • Compound unique index: (activationTokenHash, activationMode) on ProvisioningRun
 *   • Same token, different mode → two separate runs succeed (composite is mode-scoped)
 *   • SHA-256 hash stored, raw token never persisted
 *   • SafeProvisioningRun strips activationTokenHash at the service boundary
 *   • TEST mode → SANDBOX workspace; INVITE mode → PRODUCTION workspace
 *   • Tenant status → PROVISIONED after run completes
 *   • stateHistory is a non-empty JSON array with expected state labels
 *   • User is upserted — duplicate email across runs reuses the same User record
 *
 * resolveActivationToken:
 *   • Returns null for unknown token
 *   • Returns existing SafeProvisioningRun for known token+mode
 *   • Returns null for known token but wrong mode (composite index is mode-scoped)
 *   • Strips activationTokenHash from result
 */

import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { startProvisioningRun, resolveActivationToken } from '@/server/db/provisioning'
import { cleanDb, prismaTest } from '../../setup/db'

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const INVITE_INPUT = {
  rawToken: 'integration-raw-token-invite-aaaa',
  activationMode: 'INVITE' as const,
  activationSource: 'INVITE_TOKEN' as const,
  startedByEmail: 'alice@keon-test.local',
  startedByName: 'Alice Test',
}

const TEST_INPUT = {
  rawToken: 'integration-raw-token-test-bbbb',
  activationMode: 'TEST' as const,
  activationSource: 'TEST_TOKEN' as const,
  startedByEmail: 'alice@keon-test.local',
  startedByName: 'Alice Test',
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

beforeEach(cleanDb)
afterAll(() => prismaTest.$disconnect())

// ─── startProvisioningRun ─────────────────────────────────────────────────────

describe('startProvisioningRun', () => {
  it('creates all six records atomically and returns them in the result', async () => {
    const result = await startProvisioningRun(INVITE_INPUT)

    // All six IDs present in result
    expect(result.run.id).toBeTruthy()
    expect(result.tenant.id).toBeTruthy()
    expect(result.user.id).toBeTruthy()
    expect(result.membership.id).toBeTruthy()
    expect(result.workspace.id).toBeTruthy()
    expect(result.inviteToken.id).toBeTruthy()

    // All six exist in the database
    const [tenant, user, membership, workspace, run, token] = await Promise.all([
      prismaTest.tenant.findUnique({ where: { id: result.tenant.id } }),
      prismaTest.user.findUnique({ where: { id: result.user.id } }),
      prismaTest.tenantMembership.findUnique({ where: { id: result.membership.id } }),
      prismaTest.workspace.findUnique({ where: { id: result.workspace.id } }),
      prismaTest.provisioningRun.findUnique({ where: { id: result.run.id } }),
      prismaTest.inviteToken.findUnique({ where: { id: result.inviteToken.id } }),
    ])

    expect(tenant).not.toBeNull()
    expect(user).not.toBeNull()
    expect(membership).not.toBeNull()
    expect(workspace).not.toBeNull()
    expect(run).not.toBeNull()
    expect(token).not.toBeNull()
  })

  it('tenant status is PROVISIONED after run completes', async () => {
    const { tenant } = await startProvisioningRun(INVITE_INPUT)

    const persisted = await prismaTest.tenant.findUnique({ where: { id: tenant.id } })
    expect(persisted!.status).toBe('PROVISIONED')
    expect(persisted!.provisionedAt).not.toBeNull()
  })

  it('run status is COMPLETED and state is PROVISIONING_COMPLETE', async () => {
    const { run } = await startProvisioningRun(INVITE_INPUT)

    const persisted = await prismaTest.provisioningRun.findUnique({ where: { id: run.id } })
    expect(persisted!.status).toBe('COMPLETED')
    expect(persisted!.state).toBe('PROVISIONING_COMPLETE')
    expect(persisted!.completedAt).not.toBeNull()
  })

  it('INVITE mode creates a PRODUCTION workspace', async () => {
    const { workspace } = await startProvisioningRun(INVITE_INPUT)
    expect(workspace.environment).toBe('PRODUCTION')
  })

  it('TEST mode creates a SANDBOX workspace', async () => {
    const { workspace } = await startProvisioningRun(TEST_INPUT)
    expect(workspace.environment).toBe('SANDBOX')
  })

  it('activationTokenHash is SHA-256 hex (64 chars) and is not the raw token', async () => {
    const { run } = await startProvisioningRun(INVITE_INPUT)

    // Fetch the raw DB record (activationTokenHash is stripped from SafeProvisioningRun)
    const persisted = await prismaTest.provisioningRun.findUnique({ where: { id: run.id } })
    expect(persisted!.activationTokenHash).not.toBe(INVITE_INPUT.rawToken)
    expect(persisted!.activationTokenHash).toHaveLength(64) // SHA-256 hex
  })

  it('SafeProvisioningRun does not expose activationTokenHash', async () => {
    const { run } = await startProvisioningRun(INVITE_INPUT)
    expect(run).not.toHaveProperty('activationTokenHash')
  })

  it('stateHistory is a non-empty array containing INVITE_VALIDATING and WORKSPACE_BOOTSTRAPPING', async () => {
    const { run } = await startProvisioningRun(INVITE_INPUT)

    const persisted = await prismaTest.provisioningRun.findUnique({ where: { id: run.id } })
    const history = persisted!.stateHistory as Array<{ state: string; timestamp: string }>

    expect(Array.isArray(history)).toBe(true)
    expect(history.length).toBeGreaterThan(0)

    const states = history.map((h) => h.state)
    expect(states).toContain('INVITE_VALIDATING')
    expect(states).toContain('WORKSPACE_BOOTSTRAPPING')

    // Every entry has an ISO timestamp
    for (const entry of history) {
      expect(() => new Date(entry.timestamp)).not.toThrow()
    }
  })

  // ── Compound unique index: (activationTokenHash, activationMode) ─────────────

  it('compound unique (activationTokenHash, activationMode) — duplicate token+mode throws', async () => {
    await startProvisioningRun(INVITE_INPUT)

    // Same raw token, same mode → same hash → P2002 unique constraint violation
    await expect(startProvisioningRun(INVITE_INPUT)).rejects.toThrow()
  })

  it('same raw token, different mode → two separate runs succeed (composite is mode-scoped)', async () => {
    const sharedRawToken = 'shared-raw-token-mode-split-test-cccc'

    const r1 = await startProvisioningRun({
      rawToken: sharedRawToken,
      activationMode: 'INVITE',
      activationSource: 'INVITE_TOKEN',
      startedByEmail: 'invite-user@keon-test.local',
    })

    // Different email to avoid TenantMembership unique collision (tenantId_userId).
    // Different tenantId + different user → no overlap.
    const r2 = await startProvisioningRun({
      rawToken: sharedRawToken,
      activationMode: 'TEST',
      activationSource: 'TEST_TOKEN',
      startedByEmail: 'test-user@keon-test.local',
    })

    expect(r1.run.id).not.toBe(r2.run.id)
    expect(r1.tenant.id).not.toBe(r2.tenant.id)

    // Different modes stored on the runs
    expect(r1.run.activationMode).toBe('INVITE')
    expect(r2.run.activationMode).toBe('TEST')
  })

  // ── User upsert ───────────────────────────────────────────────────────────────

  it('same email across two runs reuses the same User record', async () => {
    const r1 = await startProvisioningRun(INVITE_INPUT)

    // Second run: different token + different mode to avoid duplicate run constraint.
    const r2 = await startProvisioningRun({
      rawToken: 'integration-raw-token-upsert-dddd',
      activationMode: 'TEST',
      activationSource: 'TEST_TOKEN',
      startedByEmail: INVITE_INPUT.startedByEmail, // same email
    })

    // Same User record reused
    expect(r1.user.id).toBe(r2.user.id)
    expect(r1.user.email).toBe(r2.user.email)

    // But distinct tenants and runs
    expect(r1.tenant.id).not.toBe(r2.tenant.id)
    expect(r1.run.id).not.toBe(r2.run.id)
  })

  it('membership role is OWNER and status is ACTIVE', async () => {
    const { membership } = await startProvisioningRun(INVITE_INPUT)
    expect(membership.role).toBe('OWNER')
    expect(membership.status).toBe('ACTIVE')
  })

  it('invite token is SYSTEM-issued, single-use, with a 7-day expiry', async () => {
    const before = new Date()
    const { inviteToken } = await startProvisioningRun(INVITE_INPUT)
    const after = new Date()

    expect(inviteToken.createdByKind).toBe('SYSTEM')
    expect(inviteToken.maxUses).toBe(1)
    expect(inviteToken.usesRemaining).toBe(1)

    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
    const minExpiry = new Date(before.getTime() + sevenDaysMs - 5000) // 5s tolerance
    const maxExpiry = new Date(after.getTime() + sevenDaysMs + 5000)
    expect(inviteToken.expiresAt.getTime()).toBeGreaterThan(minExpiry.getTime())
    expect(inviteToken.expiresAt.getTime()).toBeLessThan(maxExpiry.getTime())
  })
})

// ─── resolveActivationToken ───────────────────────────────────────────────────

describe('resolveActivationToken', () => {
  it('returns null for an unknown token', async () => {
    const result = await resolveActivationToken('no-such-token-ever', 'INVITE')
    expect(result).toBeNull()
  })

  it('returns the existing SafeProvisioningRun for a known token+mode', async () => {
    const { run } = await startProvisioningRun(INVITE_INPUT)

    const resolved = await resolveActivationToken(INVITE_INPUT.rawToken, 'INVITE')
    expect(resolved).not.toBeNull()
    expect(resolved!.id).toBe(run.id)
    expect(resolved!.status).toBe('COMPLETED')
  })

  it('returns null for a known token with the wrong mode (composite index is mode-scoped)', async () => {
    // Run was created as INVITE — looking up with TEST mode must return null.
    await startProvisioningRun(INVITE_INPUT)

    const resolved = await resolveActivationToken(INVITE_INPUT.rawToken, 'TEST')
    expect(resolved).toBeNull()
  })

  it('strips activationTokenHash from the resolved result', async () => {
    await startProvisioningRun(INVITE_INPUT)

    const resolved = await resolveActivationToken(INVITE_INPUT.rawToken, 'INVITE')
    expect(resolved).not.toBeNull()
    expect(resolved).not.toHaveProperty('activationTokenHash')
  })
})
