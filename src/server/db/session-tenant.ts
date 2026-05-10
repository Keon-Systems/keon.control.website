import 'server-only'
import type { MembershipRole, MembershipStatus, TenantStatus } from '@prisma/client'
import { db } from './client'

// Forward-compatible with iron-session SessionData when auth is wired.
export interface KeonSession {
  userId?: string
  tenantId?: string
}

export interface SessionTenantContext {
  tenantId: string
  tenantName: string
  tenantStatus: TenantStatus
  userId: string
}

export interface SessionMembershipContext extends SessionTenantContext {
  membershipId: string
  role: MembershipRole
  membershipStatus: MembershipStatus
}

// ─────────────────────────────────────────────────────────────────────────────
// ERRORS
// ─────────────────────────────────────────────────────────────────────────────

export class SessionTenantRequiredError extends Error {
  constructor(reason: string) {
    super(reason)
    this.name = 'SessionTenantRequiredError'
  }
}

export class SessionMembershipRequiredError extends Error {
  readonly tenantId: string
  readonly userId: string

  constructor(tenantId: string, userId: string) {
    super(`No active membership for user ${userId} in tenant ${tenantId}`)
    this.name = 'SessionMembershipRequiredError'
    this.tenantId = tenantId
    this.userId = userId
  }
}

export class SessionTenantMismatchError extends Error {
  readonly sessionTenantId: string
  readonly expectedTenantId: string

  constructor(sessionTenantId: string, expectedTenantId: string) {
    super(
      `Session tenant ${sessionTenantId} does not match expected tenant ${expectedTenantId}`,
    )
    this.name = 'SessionTenantMismatchError'
    this.sessionTenantId = sessionTenantId
    this.expectedTenantId = expectedTenantId
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RESOLVERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve tenant context from an authenticated session.
 * Fails closed on: null/undefined session, missing userId, missing tenantId,
 * cross-tenant mismatch (checked before DB), and tenant not found.
 *
 * Pass opts.expectedTenantId when the route already knows the target tenant
 * (e.g. path param) and wants to assert the session matches.
 */
export async function getSessionTenant(
  session: KeonSession | null | undefined,
  opts?: { expectedTenantId?: string },
): Promise<SessionTenantContext> {
  if (!session) {
    throw new SessionTenantRequiredError('Session is required')
  }

  const { userId, tenantId } = session

  if (!userId) {
    throw new SessionTenantRequiredError('Session is missing userId')
  }

  if (!tenantId) {
    throw new SessionTenantRequiredError('Session is missing tenantId')
  }

  // Cross-tenant guard — fail closed before any DB call (security property).
  if (opts?.expectedTenantId !== undefined && opts.expectedTenantId !== tenantId) {
    throw new SessionTenantMismatchError(tenantId, opts.expectedTenantId)
  }

  const tenant = await db.tenant.findUnique({ where: { id: tenantId } })

  if (!tenant) {
    throw new SessionTenantRequiredError(`Tenant not found: ${tenantId}`)
  }

  return {
    tenantId: tenant.id,
    tenantName: tenant.name,
    tenantStatus: tenant.status,
    userId,
  }
}

/**
 * Resolve tenant context AND verify the session user has an ACTIVE membership.
 * Fails closed on everything getSessionTenant fails on, plus:
 * missing membership, and any membership status other than ACTIVE.
 */
export async function getSessionMembership(
  session: KeonSession | null | undefined,
  opts?: { expectedTenantId?: string },
): Promise<SessionMembershipContext> {
  const tenantCtx = await getSessionTenant(session, opts)
  const { tenantId, userId } = tenantCtx

  const membership = await db.tenantMembership.findFirst({
    where: { tenantId, userId },
  })

  if (!membership || membership.status !== 'ACTIVE') {
    throw new SessionMembershipRequiredError(tenantId, userId)
  }

  return {
    ...tenantCtx,
    membershipId: membership.id,
    role: membership.role,
    membershipStatus: membership.status,
  }
}
