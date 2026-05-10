import 'server-only'
import { type NextRequest, NextResponse } from 'next/server'
import {
  getSessionMembership,
  SessionMembershipRequiredError,
  SessionTenantMismatchError,
  SessionTenantRequiredError,
  type KeonSession,
} from '@/server/db/session-tenant'
import {
  completeOnboarding,
  OnboardingAlreadyCompleteError,
  WorkspaceNotFoundError,
  type OnboardingSnapshot,
} from '@/server/db/workspace'

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST SHAPE
// ─────────────────────────────────────────────────────────────────────────────

interface CompleteOnboardingBody {
  workspaceId: string
  snapshot: OnboardingSnapshot
}

function isValidBody(body: unknown): body is CompleteOnboardingBody {
  if (typeof body !== 'object' || body === null) return false
  const b = body as Record<string, unknown>
  if (typeof b.workspaceId !== 'string' || b.workspaceId.trim() === '') return false
  if (typeof b.snapshot !== 'object' || b.snapshot === null) return false
  const s = b.snapshot as Record<string, unknown>
  if (!Array.isArray(s.selectedGoals)) return false
  return true
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION ACCESSOR
// Extracted as a const so tests can override via vi.spyOn or module mocking.
// Replace with getIronSession(req, res, sessionOptions) when auth is wired.
// ─────────────────────────────────────────────────────────────────────────────

export function getSession(_req: NextRequest): KeonSession | null {
  // TODO: return getIronSession(req, ...) when iron-session is installed.
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Session guard — resolves tenant from authenticated session.
  // Returns 401 until iron-session auth is wired (intentional, not a bug).
  const session = getSession(req)

  let membership: Awaited<ReturnType<typeof getSessionMembership>>
  try {
    membership = await getSessionMembership(session)
  } catch (err) {
    if (
      err instanceof SessionTenantRequiredError ||
      err instanceof SessionMembershipRequiredError ||
      err instanceof SessionTenantMismatchError
    ) {
      return NextResponse.json({ error: err.message }, { status: 401 })
    }
    throw err
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!isValidBody(body)) {
    return NextResponse.json(
      { error: 'workspaceId (string) and snapshot.selectedGoals (array) are required' },
      { status: 400 },
    )
  }

  try {
    const workspace = await completeOnboarding(
      membership.tenantId,
      body.workspaceId,
      body.snapshot,
    )

    return NextResponse.json({
      workspaceId: workspace.externalId,
      onboardingStatus: workspace.onboardingStatus,
      onboardingCompletedAt: workspace.onboardingCompletedAt,
    })
  } catch (err) {
    if (err instanceof WorkspaceNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }
    if (err instanceof OnboardingAlreadyCompleteError) {
      return NextResponse.json({ error: err.message }, { status: 409 })
    }
    throw err
  }
}
