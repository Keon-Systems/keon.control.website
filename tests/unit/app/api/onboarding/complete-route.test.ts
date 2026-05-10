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
    constructor(msg: string) { super(msg); this.name = 'WorkspaceNotFoundError' }
  },
  OnboardingAlreadyCompleteError: class OnboardingAlreadyCompleteError extends Error {
    constructor(msg: string) { super(msg); this.name = 'OnboardingAlreadyCompleteError' }
  },
}))

import { getSessionMembership, SessionTenantRequiredError } from '@/server/db/session-tenant'
import {
  completeOnboarding,
  WorkspaceNotFoundError,
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

const VALID_BODY = {
  workspaceId: 'ext-ws-1',
  snapshot: {
    selectedGoals: ['govern-ai-actions'],
    guardrailPreset: 'balanced',
    selectedIntegrationMode: 'BYO_AI',
  },
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
  it('returns 401 when session is missing (no auth wired)', async () => {
    mockGetSessionMembership.mockRejectedValue(
      new SessionTenantRequiredError('Session is required'),
    )
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(401)
  })

  it('returns 400 for missing workspaceId', async () => {
    mockGetSessionMembership.mockResolvedValue(MEMBERSHIP)
    const res = await POST(makeRequest({ snapshot: VALID_BODY.snapshot }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid snapshot (missing selectedGoals)', async () => {
    mockGetSessionMembership.mockResolvedValue(MEMBERSHIP)
    const res = await POST(makeRequest({ workspaceId: 'ws-1', snapshot: { guardrailPreset: 'balanced' } }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when workspace not found', async () => {
    mockGetSessionMembership.mockResolvedValue(MEMBERSHIP)
    mockCompleteOnboarding.mockRejectedValue(
      new WorkspaceNotFoundError('tenant-1', 'missing-ws'),
    )
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(404)
  })

  it('returns 409 when onboarding already complete', async () => {
    mockGetSessionMembership.mockResolvedValue(MEMBERSHIP)
    mockCompleteOnboarding.mockRejectedValue(
      new OnboardingAlreadyCompleteError('Onboarding already completed for workspace ext-ws-1'),
    )
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(409)
  })

  it('returns 200 with workspace payload on success', async () => {
    mockGetSessionMembership.mockResolvedValue(MEMBERSHIP)
    mockCompleteOnboarding.mockResolvedValue({
      externalId: 'ext-ws-1',
      onboardingStatus: 'COMPLETED',
      onboardingCompletedAt: new Date('2026-05-09T00:00:00Z'),
    })
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(200)
    const json = await res.json() as { onboardingStatus: string }
    expect(json.onboardingStatus).toBe('COMPLETED')
  })

  it('passes tenantId from membership to completeOnboarding', async () => {
    mockGetSessionMembership.mockResolvedValue(MEMBERSHIP)
    mockCompleteOnboarding.mockResolvedValue({
      externalId: 'ext-ws-1',
      onboardingStatus: 'COMPLETED',
      onboardingCompletedAt: new Date(),
    })
    await POST(makeRequest(VALID_BODY))
    expect(mockCompleteOnboarding).toHaveBeenCalledWith(
      'tenant-1',
      'ext-ws-1',
      VALID_BODY.snapshot,
    )
  })
})
