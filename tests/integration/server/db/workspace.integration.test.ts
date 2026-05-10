/**
 * KEO-13 — completeOnboarding DB integration tests
 *
 * Validates behaviors that require real Postgres:
 *
 *   • Atomic transaction: workspace → COMPLETED and tenant PROVISIONED → ACTIVE in one shot
 *   • onboardingState and onboardingVersion are persisted correctly
 *   • onboardingCompletedAt is set
 *   • OnboardingAlreadyCompleteError on re-completion attempt
 *   • Tenant already ACTIVE → updateMany is a no-op (status stays ACTIVE)
 *   • Default workspace resolution (workspaceExternalId = null) works against real data
 *   • Compound unique [tenantId, externalId] on Workspace is enforced by Postgres
 */

import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import {
  completeOnboarding,
  OnboardingAlreadyCompleteError,
  WorkspaceForbiddenError,
} from '@/server/db/workspace'
import { startProvisioningRun } from '@/server/db/provisioning'
import { cleanDb, prismaTest } from '../../setup/db'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SNAPSHOT = {
  selectedGoals: ['govern-ai-actions', 'audit-trail'],
  guardrailPreset: 'balanced',
  selectedIntegrationMode: 'BYO_AI',
  onboardingVersion: '1.0',
}

/** Provision a fresh tenant. Returns all six created records. */
async function provisionFresh(
  email = 'workspace-test@keon-test.local',
  rawToken = 'ws-token-default-aaaa',
) {
  return startProvisioningRun({
    rawToken,
    activationMode: 'INVITE',
    activationSource: 'INVITE_TOKEN',
    startedByEmail: email,
  })
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

beforeEach(cleanDb)
afterAll(() => prismaTest.$disconnect())

// ─── completeOnboarding ───────────────────────────────────────────────────────

describe('completeOnboarding — explicit workspaceExternalId', () => {
  it('atomically marks workspace COMPLETED and transitions tenant PROVISIONED → ACTIVE', async () => {
    const { tenant, workspace } = await provisionFresh()

    expect(tenant.status).toBe('PROVISIONED') // pre-condition

    const updated = await completeOnboarding(tenant.id, workspace.externalId, SNAPSHOT)

    expect(updated.onboardingStatus).toBe('COMPLETED')
    expect(updated.onboardingCompletedAt).not.toBeNull()

    // Tenant must now be ACTIVE — verified against real DB
    const refreshedTenant = await prismaTest.tenant.findUnique({ where: { id: tenant.id } })
    expect(refreshedTenant!.status).toBe('ACTIVE')
  })

  it('persists onboardingState (snapshot minus onboardingVersion) and onboardingVersion separately', async () => {
    const { tenant, workspace } = await provisionFresh()
    await completeOnboarding(tenant.id, workspace.externalId, SNAPSHOT)

    const ws = await prismaTest.workspace.findUnique({ where: { id: workspace.id } })
    const state = ws!.onboardingState as Record<string, unknown>

    expect(state.selectedGoals).toEqual(['govern-ai-actions', 'audit-trail'])
    expect(state.guardrailPreset).toBe('balanced')
    expect(state.selectedIntegrationMode).toBe('BYO_AI')
    // onboardingVersion must NOT be duplicated in onboardingState
    expect(state).not.toHaveProperty('onboardingVersion')

    expect(ws!.onboardingVersion).toBe('1.0')
  })

  it('throws OnboardingAlreadyCompleteError on a second completion attempt', async () => {
    const { tenant, workspace } = await provisionFresh()
    await completeOnboarding(tenant.id, workspace.externalId, SNAPSHOT)

    await expect(
      completeOnboarding(tenant.id, workspace.externalId, SNAPSHOT),
    ).rejects.toThrow(OnboardingAlreadyCompleteError)
  })

  it('tenant already ACTIVE: updateMany is a no-op — status stays ACTIVE', async () => {
    const { tenant, workspace } = await provisionFresh()

    // First call: PROVISIONED → ACTIVE
    await completeOnboarding(tenant.id, workspace.externalId, SNAPSHOT)

    // Reset workspace onboarding so we can call again
    await prismaTest.workspace.update({
      where: { id: workspace.id },
      data: { onboardingStatus: 'NOT_STARTED', onboardingCompletedAt: null },
    })

    // Second call: tenant is already ACTIVE — updateMany WHERE status=PROVISIONED is a no-op
    await completeOnboarding(tenant.id, workspace.externalId, { ...SNAPSHOT, onboardingVersion: '1.1' })

    const refreshed = await prismaTest.tenant.findUnique({ where: { id: tenant.id } })
    expect(refreshed!.status).toBe('ACTIVE') // still ACTIVE, not regressed
  })

  it('throws WorkspaceForbiddenError for a workspace that does not belong to the tenant', async () => {
    const { tenant } = await provisionFresh()

    await expect(
      completeOnboarding(tenant.id, 'completely-foreign-external-id', SNAPSHOT),
    ).rejects.toThrow(WorkspaceForbiddenError)
  })
})

describe('completeOnboarding — default workspace resolution (null externalId)', () => {
  it('resolves the single workspace when workspaceExternalId is null', async () => {
    const { tenant } = await provisionFresh()

    // startProvisioningRun creates exactly one workspace — default resolution should find it.
    const updated = await completeOnboarding(tenant.id, null, SNAPSHOT)
    expect(updated.onboardingStatus).toBe('COMPLETED')
  })
})

describe('Workspace schema constraints', () => {
  it('compound unique [tenantId, externalId] — duplicate insert throws P2002', async () => {
    const { tenant, workspace } = await provisionFresh()

    await expect(
      prismaTest.workspace.create({
        data: {
          tenantId: tenant.id,
          externalId: workspace.externalId, // deliberate duplicate
          name: 'duplicate-workspace',
          environment: 'SANDBOX',
          onboardingStatus: 'NOT_STARTED',
        },
      }),
    ).rejects.toThrow() // Prisma P2002 — unique constraint on (tenantId, externalId)
  })

  it('same externalId under different tenants is allowed', async () => {
    const r1 = await provisionFresh('user-a@keon-test.local', 'ws-token-tenant-a')
    const r2 = await provisionFresh('user-b@keon-test.local', 'ws-token-tenant-b')

    // Force both workspaces to have the same externalId (the constraint is per-tenant)
    const sharedExternalId = 'shared-external-id-cross-tenant'

    await prismaTest.workspace.update({
      where: { id: r1.workspace.id },
      data: { externalId: sharedExternalId },
    })
    await prismaTest.workspace.update({
      where: { id: r2.workspace.id },
      data: { externalId: sharedExternalId },
    })

    // Both should exist without constraint violation
    const ws1 = await prismaTest.workspace.findUnique({
      where: { tenantId_externalId: { tenantId: r1.tenant.id, externalId: sharedExternalId } },
    })
    const ws2 = await prismaTest.workspace.findUnique({
      where: { tenantId_externalId: { tenantId: r2.tenant.id, externalId: sharedExternalId } },
    })
    expect(ws1).not.toBeNull()
    expect(ws2).not.toBeNull()
  })
})
