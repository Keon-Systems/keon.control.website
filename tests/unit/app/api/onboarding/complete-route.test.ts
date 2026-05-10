import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/server/db/session-tenant', () => ({
  getSessionMembership: vi.fn(),
  SessionTenantRequiredError: class SessionTenantRequiredError extends Error {
    constructor(msg: string) { super(msg); this.name = 'SessionTenantRequiredError' }
  },
  SessionMembershipRequiredError: class SessionMembershipRequiredError extends Error {
    constructor(msg: string) { super(msg); this.name = 'SessionMembershipRequiredError' }
  },
  SessionTenantMismatchError: class SessionTenantMismatchError extends Error {
    constructor(msg: string) { super(msg); this.name = 'SessionTenantMismatchError' }
  },
}))

vi.mock('@/server/db/workspace', () => ({
  completeOnboarding: vi.fn(),
  WorkspaceNotFoundError: class WorkspaceNotFoundError extends Error {
    constructor(tenantId: string, externalId: string) {
      super(`Workspace ${externalId} not found for tenant ${tenantId}`)
      this.name = 'WorkspaceNotFoundError'
    }
  },
  WorkspaceForbiddenError: class WorkspaceForbiddenError extends Error {
    constructor(externalId: string) {
      super(`Workspace ${externalId} does not belong to the current tenant`)
      this.name = 'WorkspaceForbiddenError'
    }
  },
  WorkspaceAmbiguousError: class WorkspaceAmbiguousError extends Error {
    constructor(tenantId: string, count: number) {
      super(`Tenant ${tenantId} has ${count} workspaces`)
      this.name = 'WorkspaceAmbiguousError'
    }
  },
  OnboardingAlreadyCompleteError: class OnboardingAlreadyCompleteError extends Error {
    constructor(externalId: string) {
      super(`Onboarding already completed for workspace ${externalId}`)
      this.name = 'OnboardingAlreadyCompleteError'
    }
  },
}))

import { getSessionMembership, SessionTenantRequiredError } from '@/server/db/session-tenant'
import {
  completeOnboarding,
  WorkspaceNotFoundError,
  WorkspaceForbiddenError,
  WorkspaceAmbiguousError,
  OnboardingAlreadyCompleteError,
} from '@/server/db/workspace'
import { POST } from '@/app/api/onboarding/complete/route'

const mockGetSessionMembership = getSessionMembership as ReturnType<typeof vi.fn>
const mockCompleteOnboarding = completeOnboarding as ReturnType<typeof vi.fn>

const MEMBERSHIP = {
  tenantId: 'tenant-1',
  tenantName: 'Acme',
  tenantStatus: 'ACTIVE' as const,
  userId: 'user-1',
  membershipId: 'membership-1',
  role: 'OWNER' as const,
  membershipStatus: 'ACTIVE' as const,
}

const SNAPSHOT = {
  selectedGoals: ['govern-ai-actions'],
  guardrailPreset: 'balanced',
  selectedIntegrationMode: 'BYO_AI',
}

const WORKSPACE_RESULT = {
  externalId: 'ext-ws-1',
  onboardingStatus: 'COMPLETED',
  onboardingCompletedAt: new Date('2026-05-10T00:00:00Z'),
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/onboarding/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/onboarding/complete', () => {
  // ── Auth ──────────────────────────────────────────────────────────────────

  it('returns 401 when session is missing (no auth wired)', async () => {
    mockGetSessionMembership.mockRejectedValue(
      new SessionTenantRequiredError('Session is required'),
    )
    const res = await POST(makeRequest({ snapshot: SNAPSHOT }))
    expect(res.status).toBe(401)
  })

  // ── Validation ────────────────────────────────────────────────────────────

  it('returns 400 when snapshot is missing selectedGoals', async () => {
    mockGetSessionMembership.mockResolvedValue(MEMBERSHIP)
    const res = await POST(makeRequest({ snapshot: { guardrailPreset: 'balanced' } }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when workspaceId is present but empty string', async () => {
    mockGetSessionMembership.mockResolvedValue(MEMBERSHIP)
    const res = await POST(makeRequest({ workspaceId: '', snapshot: SNAPSHOT }))
    expect(res.status).toBe(400)
  })

  // ── Default workspace resolution ──────────────────────────────────────────

  it('returns 404 when tenant has no workspaces (default resolution)', async () => {
    mockGetSessionMembership.mockResolvedValue(MEMBERSHIP)
    mockCompleteOnboarding.mockRejectedValue(
      new WorkspaceNotFoundError('tenant-1', '(default)'),
    )
    const res = await POST(makeRequest({ snapshot: SNAPSHOT }))
    expect(res.status).toBe(404)
  })

  it('returns 409 when no workspaceId provided and tenant has multiple workspaces', async () => {
    mockGetSessionMembership.mockResolvedValue(MEMBERSHIP)
    mockCompleteOnboarding.mockRejectedValue(
      new WorkspaceAmbiguousError('tenant-1', 2),
    )
    const res = await POST(makeRequest({ snapshot: SNAPSHOT }))
    expect(res.status).toBe(409)
  })

  it('returns 200 when no workspaceId and single default workspace completes', async () => {
    mockGetSessionMembership.mockResolvedValue(MEMBERSHIP)
    mockCompleteOnboarding.mockResolvedValue(WORKSPACE_RESULT)
    const res = await POST(makeRequest({ snapshot: SNAPSHOT }))
    expect(res.status).toBe(200)
    // null passed to service for default resolution
    expect(mockCompleteOnboarding).toHaveBeenCalledWith('tenant-1', null, SNAPSHOT)
  })

  // ── Explicit workspaceId ──────────────────────────────────────────────────

  it('returns 403 when provided workspaceId belongs to another tenant', async () => {
    mockGetSessionMembership.mockResolvedValue(MEMBERSHIP)
    mockCompleteOnboarding.mockRejectedValue(
      new WorkspaceForbiddenError('foreign-ws'),
    )
    const res = await POST(makeRequest({ workspaceId: 'foreign-ws', snapshot: SNAPSHOT }))
    expect(res.status).toBe(403)
  })

  it('returns 409 when onboarding already complete', async () => {
    mockGetSessionMembership.mockResolvedValue(MEMBERSHIP)
    mockCompleteOnboarding.mockRejectedValue(
      new OnboardingAlreadyCompleteError('ext-ws-1'),
    )
    const res = await POST(makeRequest({ workspaceId: 'ext-ws-1', snapshot: SNAPSHOT }))
    expect(res.status).toBe(409)
  })

  it('returns 200 and passes workspaceId to service when provided', async () => {
    mockGetSessionMembership.mockResolvedValue(MEMBERSHIP)
    mockCompleteOnboarding.mockResolvedValue(WORKSPACE_RESULT)
    const res = await POST(makeRequest({ workspaceId: 'ext-ws-1', snapshot: SNAPSHOT }))
    expect(res.status).toBe(200)
    expect(mockCompleteOnboarding).toHaveBeenCalledWith('tenant-1', 'ext-ws-1', SNAPSHOT)
    const json = await res.json() as { onboardingStatus: string }
    expect(json.onboardingStatus).toBe('COMPLETED')
  })
})
