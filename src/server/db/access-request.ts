import 'server-only'
import type { AccessAudience, AccessRequest, AccessRequestStatus } from '@prisma/client'
import { db } from './client'

// ─── Errors ───────────────────────────────────────────────────────────────────

export class AccessRequestNotFoundError extends Error {
  readonly requestId: string

  constructor(requestId: string) {
    super(`AccessRequest not found: ${requestId}`)
    this.name = 'AccessRequestNotFoundError'
    this.requestId = requestId
  }
}

export class AccessRequestStateError extends Error {
  readonly requestId: string
  readonly currentStatus: AccessRequestStatus

  constructor(message: string, requestId: string, currentStatus: AccessRequestStatus) {
    super(message)
    this.name = 'AccessRequestStateError'
    this.requestId = requestId
    this.currentStatus = currentStatus
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateAccessRequestInput {
  email: string
  name?: string
  organization?: string
  /** Prisma enum. Defaults to BUILDER if omitted. */
  audience?: AccessAudience
  intendedUse?: string
}

export interface ReviewMeta {
  reviewedByEmail: string
  decisionReason?: string
}

// ─── createAccessRequest ──────────────────────────────────────────────────────
// Persists a new access request form submission. Status starts as RECEIVED.
// Idempotency is NOT enforced here — duplicate emails create separate requests.
// Deduplication is a review-layer concern; callers may query by email first.

export async function createAccessRequest(
  input: CreateAccessRequestInput,
): Promise<AccessRequest> {
  return db.accessRequest.create({
    data: {
      email: input.email,
      name: input.name ?? null,
      organization: input.organization ?? null,
      audience: input.audience ?? 'BUILDER',
      intendedUse: input.intendedUse ?? null,
      status: 'RECEIVED',
    },
  })
}

// ─── getAccessRequest ─────────────────────────────────────────────────────────

export async function getAccessRequest(id: string): Promise<AccessRequest | null> {
  return db.accessRequest.findUnique({ where: { id } })
}

// ─── updateAccessRequestStatus ────────────────────────────────────────────────
// Canonical status mutation per directive. Enforces allowed transitions:
//   RECEIVED   → REVIEWING, APPROVED, REJECTED
//   REVIEWING  → APPROVED, REJECTED
//   APPROVED   → PROVISIONED (via provisioning pipeline; not directly callable here)
//   REJECTED   → terminal
//   PROVISIONED → terminal
//
// approveAccessRequest() and rejectAccessRequest() are ergonomic wrappers around
// this function that enforce their own narrower preconditions. Both are kept as
// named exports for readability at call sites, but all mutations flow through here.
// No downstream lane should depend on the wrappers directly — they should call
// updateAccessRequestStatus or the wrappers interchangeably.

const TERMINAL_STATUSES: AccessRequestStatus[] = ['REJECTED', 'PROVISIONED']

const ALLOWED_TRANSITIONS: Record<AccessRequestStatus, AccessRequestStatus[]> = {
  RECEIVED: ['REVIEWING', 'APPROVED', 'REJECTED'],
  REVIEWING: ['APPROVED', 'REJECTED'],
  APPROVED: ['PROVISIONED'],
  REJECTED: [],
  PROVISIONED: [],
}

export async function updateAccessRequestStatus(
  id: string,
  status: AccessRequestStatus,
  meta?: ReviewMeta,
): Promise<AccessRequest> {
  const existing = await db.accessRequest.findUnique({ where: { id } })
  if (!existing) throw new AccessRequestNotFoundError(id)

  const allowed = ALLOWED_TRANSITIONS[existing.status]
  if (!allowed.includes(status)) {
    throw new AccessRequestStateError(
      `Cannot transition AccessRequest from ${existing.status} → ${status}`,
      id,
      existing.status,
    )
  }

  return db.accessRequest.update({
    where: { id },
    data: {
      status,
      ...(meta?.reviewedByEmail && {
        reviewedByEmail: meta.reviewedByEmail,
        reviewedAt: new Date(),
        decisionReason: meta.decisionReason ?? null,
      }),
    },
  })
}

// ─── approveAccessRequest ─────────────────────────────────────────────────────
// Ergonomic wrapper. Narrower guard: refuses REJECTED and PROVISIONED explicitly.

export async function approveAccessRequest(
  id: string,
  reviewedByEmail: string,
  decisionReason?: string,
): Promise<AccessRequest> {
  const existing = await db.accessRequest.findUnique({ where: { id } })
  if (!existing) throw new AccessRequestNotFoundError(id)

  if (TERMINAL_STATUSES.includes(existing.status)) {
    throw new AccessRequestStateError(
      `Cannot approve access request in terminal status: ${existing.status}`,
      id,
      existing.status,
    )
  }

  return updateAccessRequestStatus(id, 'APPROVED', { reviewedByEmail, decisionReason })
}

// ─── rejectAccessRequest ──────────────────────────────────────────────────────
// Ergonomic wrapper. decisionReason is required for audit trail.

export async function rejectAccessRequest(
  id: string,
  reviewedByEmail: string,
  decisionReason: string,
): Promise<AccessRequest> {
  const existing = await db.accessRequest.findUnique({ where: { id } })
  if (!existing) throw new AccessRequestNotFoundError(id)

  if (existing.status === 'PROVISIONED') {
    throw new AccessRequestStateError(
      `Cannot reject a request that is already PROVISIONED`,
      id,
      existing.status,
    )
  }

  return updateAccessRequestStatus(id, 'REJECTED', { reviewedByEmail, decisionReason })
}
