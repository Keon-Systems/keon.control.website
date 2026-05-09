import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getSessionTenant,
  getSessionMembership,
  SessionTenantRequiredError,
  SessionMembershipRequiredError,
  SessionTenantMismatchError,
} from '@/server/db/session-tenant'

vi.mock('@/server/db/client', () => ({
  db: {
    tenant: { findUnique: vi.fn() },
    tenantMembership: { findFirst: vi.fn() },
  },
}))

import { db } from '@/server/db/client'

const mockFindUnique = db.tenant.findUnique as ReturnType<typeof vi.fn>
const mockFindFirst = db.tenantMembership.findFirst as ReturnType<typeof vi.fn>

const TENANT = {
  id: 'tenant-1',
  name: 'Acme Corp',
  status: 'ACTIVE' as const,
  externalId: 'acme',
  createdAt: new Date(),
  updatedAt: new Date(),
  provisionedAt: null,
  suspendedAt: null,
  metadata: {},
}

const MEMBERSHIP = {
  id: 'membership-1',
  tenantId: 'tenant-1',
  userId: 'user-1',
  role: 'OWNER' as const,
  status: 'ACTIVE' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const SESSION = { userId: 'user-1', tenantId: 'tenant-1' }

beforeEach(() => {
  vi.clearAllMocks()
})

// ─────────────────────────────────────────────────────────────────────────────
// getSessionTenant
// ─────────────────────────────────────────────────────────────────────────────

describe('getSessionTenant', () => {
  it('throws SessionTenantRequiredError when session is null', async () => {
    await expect(getSessionTenant(null)).rejects.toThrow(SessionTenantRequiredError)
  })

  it('throws SessionTenantRequiredError when userId is missing', async () => {
    await expect(getSessionTenant({ tenantId: 'tenant-1' })).rejects.toThrow(
      SessionTenantRequiredError,
    )
  })

  it('throws SessionTenantRequiredError when tenantId is missing', async () => {
    await expect(getSessionTenant({ userId: 'user-1' })).rejects.toThrow(
      SessionTenantRequiredError,
    )
  })

  it('throws SessionTenantMismatchError before DB when expectedTenantId differs', async () => {
    await expect(
      getSessionTenant(SESSION, { expectedTenantId: 'other-tenant' }),
    ).rejects.toThrow(SessionTenantMismatchError)
    expect(mockFindUnique).not.toHaveBeenCalled()
  })

  it('throws SessionTenantRequiredError when tenant not found in DB', async () => {
    mockFindUnique.mockResolvedValue(null)
    await expect(getSessionTenant(SESSION)).rejects.toThrow(SessionTenantRequiredError)
  })

  it('returns SessionTenantContext on success', async () => {
    mockFindUnique.mockResolvedValue(TENANT)
    const ctx = await getSessionTenant(SESSION)
    expect(ctx).toEqual({
      tenantId: 'tenant-1',
      tenantName: 'Acme Corp',
      tenantStatus: 'ACTIVE',
      userId: 'user-1',
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// getSessionMembership
// ─────────────────────────────────────────────────────────────────────────────

describe('getSessionMembership', () => {
  it('throws SessionMembershipRequiredError when membership not found', async () => {
    mockFindUnique.mockResolvedValue(TENANT)
    mockFindFirst.mockResolvedValue(null)
    await expect(getSessionMembership(SESSION)).rejects.toThrow(
      SessionMembershipRequiredError,
    )
  })

  it('throws SessionMembershipRequiredError when membership is not ACTIVE', async () => {
    mockFindUnique.mockResolvedValue(TENANT)
    mockFindFirst.mockResolvedValue({ ...MEMBERSHIP, status: 'SUSPENDED' })
    await expect(getSessionMembership(SESSION)).rejects.toThrow(
      SessionMembershipRequiredError,
    )
  })

  it('returns SessionMembershipContext on success', async () => {
    mockFindUnique.mockResolvedValue(TENANT)
    mockFindFirst.mockResolvedValue(MEMBERSHIP)
    const ctx = await getSessionMembership(SESSION)
    expect(ctx).toEqual({
      tenantId: 'tenant-1',
      tenantName: 'Acme Corp',
      tenantStatus: 'ACTIVE',
      userId: 'user-1',
      membershipId: 'membership-1',
      role: 'OWNER',
      membershipStatus: 'ACTIVE',
    })
  })
})
