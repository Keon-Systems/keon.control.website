/**
 * KEO-13 — getSessionMembership DB integration tests
 *
 * The unit tests cover null session, missing fields, and mismatch checks that
 * are pure logic (no DB hit). These integration tests cover the DB-dependent
 * paths that require real records:
 *
 *   • ACTIVE membership → returns full SessionMembershipContext with correct fields
 *   • SUSPENDED membership → throws SessionMembershipRequiredError
 *   • INACTIVE membership → throws SessionMembershipRequiredError
 *   • Tenant not found → throws SessionTenantRequiredError
 *   • User has no membership for the tenant → throws SessionMembershipRequiredError
 */

import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import {
  getSessionMembership,
  SessionMembershipRequiredError,
  SessionTenantRequiredError,
} from '@/server/db/session-tenant'
import { startProvisioningRun } from '@/server/db/provisioning'
import { cleanDb, prismaTest } from '../../setup/db'

// ─── Lifecycle ────────────────────────────────────────────────────────────────

beforeEach(cleanDb)
afterAll(() => prismaTest.$disconnect())

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function provisionFresh(
  email = 'session-test@keon-test.local',
  rawToken = 'session-token-aaaa',
) {
  return startProvisioningRun({
    rawToken,
    activationMode: 'INVITE',
    activationSource: 'INVITE_TOKEN',
    startedByEmail: email,
  })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('getSessionMembership — real DB', () => {
  it('returns full SessionMembershipContext for an ACTIVE OWNER membership', async () => {
    const { tenant, user, membership } = await provisionFresh()

    const ctx = await getSessionMembership({ userId: user.id, tenantId: tenant.id })

    expect(ctx.tenantId).toBe(tenant.id)
    expect(ctx.tenantName).toBe(tenant.name)
    expect(ctx.tenantStatus).toBe('PROVISIONED')
    expect(ctx.userId).toBe(user.id)
    expect(ctx.membershipId).toBe(membership.id)
    expect(ctx.role).toBe('OWNER')
    expect(ctx.membershipStatus).toBe('ACTIVE')
  })

  it('throws SessionMembershipRequiredError when membership is SUSPENDED', async () => {
    const { tenant, user, membership } = await provisionFresh()

    await prismaTest.tenantMembership.update({
      where: { id: membership.id },
      data: { status: 'SUSPENDED' },
    })

    await expect(
      getSessionMembership({ userId: user.id, tenantId: tenant.id }),
    ).rejects.toThrow(SessionMembershipRequiredError)
  })

  it('throws SessionMembershipRequiredError when membership is INACTIVE', async () => {
    const { tenant, user, membership } = await provisionFresh()

    await prismaTest.tenantMembership.update({
      where: { id: membership.id },
      data: { status: 'INACTIVE' },
    })

    await expect(
      getSessionMembership({ userId: user.id, tenantId: tenant.id }),
    ).rejects.toThrow(SessionMembershipRequiredError)
  })

  it('throws SessionTenantRequiredError when the tenant does not exist', async () => {
    // No tenant seeded — ghost ID should fail at the tenant lookup
    await expect(
      getSessionMembership({
        userId: 'ghost-user-id-0000000000',
        tenantId: 'ghost-tenant-id-0000000',
      }),
    ).rejects.toThrow(SessionTenantRequiredError)
  })

  it('throws SessionMembershipRequiredError when user has no membership for the tenant', async () => {
    const { tenant } = await provisionFresh()

    // Create a user with no membership in this tenant
    const stranger = await prismaTest.user.create({
      data: { email: 'stranger@keon-test.local' },
    })

    await expect(
      getSessionMembership({ userId: stranger.id, tenantId: tenant.id }),
    ).rejects.toThrow(SessionMembershipRequiredError)
  })

  it('reflects tenantStatus = ACTIVE after onboarding completes', async () => {
    const { tenant, user, workspace } = await provisionFresh()

    // Manually advance tenant to ACTIVE (mirrors what completeOnboarding does)
    await prismaTest.tenant.update({
      where: { id: tenant.id },
      data: { status: 'ACTIVE' },
    })
    // Mark workspace completed too so it's consistent
    await prismaTest.workspace.update({
      where: { id: workspace.id },
      data: { onboardingStatus: 'COMPLETED', onboardingCompletedAt: new Date() },
    })

    const ctx = await getSessionMembership({ userId: user.id, tenantId: tenant.id })
    expect(ctx.tenantStatus).toBe('ACTIVE')
  })
})
