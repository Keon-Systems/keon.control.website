/**
 * MOVED — this path is deprecated.
 * The canonical endpoint is /api/access-requests (plural).
 * Delete this file once keon-systems-web is updated in KEO-15.
 *
 * Returning 410 Gone so any stale callers fail loudly rather than silently
 * routing to an abandoned handler.
 */
import { NextResponse } from 'next/server'

export function POST() {
  return NextResponse.json(
    {
      error: 'endpoint_moved',
      message: 'This endpoint has moved to /api/access-requests (plural). Please update your client.',
    },
    { status: 410 },
  )
}
