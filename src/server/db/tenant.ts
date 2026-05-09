import 'server-only'
import type { MembershipRole, Tenant, TenantMembership } from '@prisma/client'
import { db } from './client'

// Role hierarchy — higher number = more privilege
const ROLE_WEIGHT: Record<MembershipRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  READONLY: 1,
}

export class TenantAccessError extends Error {
  readonly tenantId: string
  readonly userId: string

  constructor(message: string, tenantId: string, userId: string) {
    super(message)
    this.name = 'TenantAccessError'
    this.tenantId = tenantId
    this.userId = userId
  }
}

/**
 * Fetch a tenant and verify the caller has an active membership.
 * Throws TenantAccessError if the tenant doesn't exist or the user
 * is not an active member.
 *
 * ⚠️ Raw queries (prisma.$queryRaw) bypass this guard — see ADR-0005.
 */
export async function getTenantOrThrow(
  tenantId: string,
  userId: string,
): Promise<Tenant & { membership: TenantMembership }> {
  const [tenant, membership] = await Promise.all([
    db.tenant.findUnique({ where: { id: tenantId } }),
    db.tenantMembership.findFirst({
      where: { tenantId, userId, status: 'ACTIVE' },
    }),
  ])

  if (!tenant) {
    throw new TenantAccessError(
      `Tenant not found: ${tenantId}`,
      tenantId,
      userId,
    )
  }

  if (!membership) {
    throw new TenantAccessError(
      `User ${userId} is not an active member of tenant ${tenantId}`,
      tenantId,
      userId,
    )
  }

  return { ...tenant, membership }
}

/**
 * Verify the caller has an active membership with at least minRole privilege.
 * Returns the membership record on success.
 * Throws TenantAccessError if the user is not a member or lacks the required role.
 *
 * ⚠️ Raw queries (prisma.$queryRaw) bypass this guard — see ADR-0005.
 */
export async function requireMembership(
  tenantId: string,
  userId: string,
  minRole: MembershipRole = 'MEMBER',
): Promise<TenantMembership> {
  const membership = await db.tenantMembership.findFirst({
    where: { tenantId, userId, status: 'ACTIVE' },
  })

  if (!membership) {
    throw new TenantAccessError(
      `User ${userId} is not an active member of tenant ${tenantId}`,
      tenantId,
      userId,
    )
  }

  if (ROLE_WEIGHT[membership.role] < ROLE_WEIGHT[minRole]) {
    throw new TenantAccessError(
      `User ${userId} has insufficient role: ${membership.role} (requires ${minRole})`,
      tenantId,
      userId,
    )
  }

  return membership
}
