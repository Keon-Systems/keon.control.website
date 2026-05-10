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
  WorkspaceAmbiguousError,
  WorkspaceForbiddenError,
  WorkspaceNotFoundError,
  type OnboardingSnapshot,
} from '@/server/db/workspace'

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST SHAPE
// ─────────────────────────────────────────────────────────────────────────────

interface CompleteOnboardingBody {
  workspaceId?: string // optional — omit to resolve single default workspace
  snapshot: OnboardingSnapshot
}

function isValidBody(body: unknown): body is CompleteOnboardingBody {
  if (typeof body !== 'object' || body === null) return false
  const b = body as Record<string, unknown>
  // workspaceId is optional; if present must be a non-empty string
  if ('workspaceId' in b && (typeof b.workspaceId !== 'string' || b.workspaceId.trim() === '')) {
    return false
  }
  if (typeof b.snapshot !== 'object' || b.snapshot === null) return false
  const s = b.snapshot as Record<string, unknown>
  if (!Array.isArray(s.selectedGoals)) return false
  return true
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION ACCESSOR
// Extracted as a named export so tests can override via vi.spyOn.
// Replace with getIronSession(req, res, sessionOptions) when auth is wired.
// ─────────────────────────────────────────────────────────────────────────────

export function getSession(_req: NextRequest): KeonSession | null {
  // TODO: return getIronSession(req, ...) when iron-session is installed.
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/onboarding/complete
 *
 * Marks a workspace's onboarding as complete and transitions the tenant to ACTIVE.
 * Session-guarded via getSessionMembership (KEO-11).
 *
 * Workspace resolution:
 *   - No workspaceId in body → resolve tenant's single default workspace (409 if ambiguous)
 *   - workspaceId provided    → must belong to session tenant, else 403
 *
 * Returns 401 until iron-session auth is wired. This is intentional, not a bug.
 * The CompleteStep UI calls this as fire-and-forget and does not block on the response.
 * Onboarding persistence is best-effort until real auth/session wiring exists;
 * a 200 from this endpoint is not required for the UI redirect to proceed.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
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
      { error: 'snapshot.selectedGoals (array) is required; workspaceId must be a non-empty string if provided' },
      { status: 400 },
    )
  }

  // null = resolve default workspace; string = explicit lookup
  const workspaceExternalId = body.workspaceId ?? null

  try {
    const workspace = await completeOnboarding(
      membership.tenantId,
      workspaceExternalId,
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
    if (err instanceof WorkspaceForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 403 })
    }
    if (err instanceof WorkspaceAmbiguousError || err instanceof OnboardingAlreadyCompleteError) {
      return NextResponse.json({ error: err.message }, { status: 409 })
    }
    throw err
  }
}
