/**
 * KEON CONTROL — ACCESS REQUEST PERSISTENCE API
 *
 * POST /api/access-requests
 *   Persists an inbound access request to the AccessRequest table.
 *   Called by keon-systems-web after sending email confirmations (KEO-15 wires
 *   the forwarding; until then this endpoint is used directly or in tests).
 *
 *   Returns { id, status } on success (201). The email confirmation flow
 *   remains in keon-systems-web for now — this route handles persistence only.
 *
 * NOTE: No auth required on this endpoint — it is intentionally public.
 * Honeypot filtering and rate-limiting are the caller's responsibility.
 */

import { createAccessRequest } from '@/server/db/access-request'
import type { AccessAudience } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

// Map lowercase public-form audience values → Prisma enum (uppercase)
const AUDIENCE_MAP: Record<string, AccessAudience> = {
  builder: 'BUILDER',
  architect: 'ARCHITECT',
  operator: 'OPERATOR',
  enterprise: 'ENTERPRISE',
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_json', message: 'Invalid JSON body.' },
      { status: 400 },
    )
  }

  const b = body as Record<string, unknown>

  const email = typeof b.email === 'string' ? b.email.trim() : ''
  const name = typeof b.name === 'string' ? b.name.trim() || undefined : undefined
  const organization =
    typeof b.organization === 'string' ? b.organization.trim() || undefined : undefined
  const rawAudience =
    typeof b.audience === 'string' ? b.audience.trim().toLowerCase() : ''
  const intendedUse =
    typeof b.intendedUse === 'string' ? b.intendedUse.trim() || undefined : undefined

  if (!email) {
    return NextResponse.json(
      { error: 'email_required', message: 'email is required.' },
      { status: 400 },
    )
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: 'invalid_email', message: 'Invalid email address.' },
      { status: 400 },
    )
  }

  const audience = AUDIENCE_MAP[rawAudience] ?? 'BUILDER'

  try {
    const request = await createAccessRequest({ email, name, organization, audience, intendedUse })
    return NextResponse.json({ id: request.id, status: request.status }, { status: 201 })
  } catch (err) {
    console.error('[access-requests] createAccessRequest failed:', err)
    return NextResponse.json(
      { error: 'internal_error', message: 'Unable to store access request.' },
      { status: 500 },
    )
  }
}
