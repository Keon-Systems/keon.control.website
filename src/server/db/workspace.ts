import 'server-only'
import type { Workspace } from '@prisma/client'
import { db } from './client'

export interface OnboardingSnapshot {
  selectedGoals: string[]
  guardrailPreset: string | null
  selectedIntegrationMode: string | undefined
  onboardingVersion?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// ERRORS
// ─────────────────────────────────────────────────────────────────────────────

export class WorkspaceNotFoundError extends Error {
  readonly tenantId: string
  readonly workspaceExternalId: string

  constructor(tenantId: string, workspaceExternalId: string) {
    super(`Workspace ${workspaceExternalId} not found for tenant ${tenantId}`)
    this.name = 'WorkspaceNotFoundError'
    this.tenantId = tenantId
    this.workspaceExternalId = workspaceExternalId
  }
}

/**
 * Thrown when an explicit workspaceId was provided but is not found under the
 * session tenant. The workspace may exist on another tenant; we do not confirm
 * this to avoid cross-tenant information leakage.
 */
export class WorkspaceForbiddenError extends Error {
  readonly workspaceExternalId: string

  constructor(workspaceExternalId: string) {
    super(`Workspace ${workspaceExternalId} does not belong to the current tenant`)
    this.name = 'WorkspaceForbiddenError'
    this.workspaceExternalId = workspaceExternalId
  }
}

/**
 * Thrown when no workspaceId was provided but the tenant has more than one
 * workspace; the caller must supply an explicit workspaceId to disambiguate.
 */
export class WorkspaceAmbiguousError extends Error {
  readonly tenantId: string
  readonly count: number

  constructor(tenantId: string, count: number) {
    super(`Tenant ${tenantId} has ${count} workspaces — provide an explicit workspaceId`)
    this.name = 'WorkspaceAmbiguousError'
    this.tenantId = tenantId
    this.count = count
  }
}

export class OnboardingAlreadyCompleteError extends Error {
  readonly workspaceExternalId: string

  constructor(workspaceExternalId: string) {
    super(`Onboarding already completed for workspace ${workspaceExternalId}`)
    this.name = 'OnboardingAlreadyCompleteError'
    this.workspaceExternalId = workspaceExternalId
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mark a workspace's onboarding as complete and transition the tenant to ACTIVE.
 *
 * Workspace resolution:
 *   workspaceExternalId = null  → resolve the tenant's single default workspace.
 *                                 Throws WorkspaceNotFoundError if none exist.
 *                                 Throws WorkspaceAmbiguousError if >1 exist.
 *   workspaceExternalId = string → look up by (tenantId, externalId).
 *                                  Throws WorkspaceForbiddenError if not found
 *                                  under this tenant (prevents cross-tenant leakage).
 *
 * Atomically:
 *   1. Updates Workspace.onboardingStatus → COMPLETED
 *   2. Sets Workspace.onboardingCompletedAt, onboardingVersion, onboardingState
 *   3. Transitions Tenant.status PROVISIONED → ACTIVE (no-op for other statuses)
 *
 * Throws OnboardingAlreadyCompleteError if onboarding was already COMPLETED.
 */
export async function completeOnboarding(
  tenantId: string,
  workspaceExternalId: string | null,
  snapshot: OnboardingSnapshot,
): Promise<Workspace> {
  let workspace: Workspace

  if (workspaceExternalId === null) {
    // Resolve default workspace — must be exactly one.
    const workspaces = await db.workspace.findMany({ where: { tenantId } })

    if (workspaces.length === 0) {
      throw new WorkspaceNotFoundError(tenantId, '(default)')
    }
    if (workspaces.length > 1) {
      throw new WorkspaceAmbiguousError(tenantId, workspaces.length)
    }

    workspace = workspaces[0]
  } else {
    // Explicit id — must belong to this tenant. If not found, return forbidden
    // rather than not-found to avoid confirming workspace existence on other tenants.
    const found = await db.workspace.findUnique({
      where: { tenantId_externalId: { tenantId, externalId: workspaceExternalId } },
    })

    if (!found) {
      throw new WorkspaceForbiddenError(workspaceExternalId)
    }

    workspace = found
  }

  if (workspace.onboardingStatus === 'COMPLETED') {
    throw new OnboardingAlreadyCompleteError(workspace.externalId)
  }

  const { onboardingVersion, ...stateData } = snapshot

  return db.$transaction(async (tx) => {
    const updated = await tx.workspace.update({
      where: { id: workspace.id },
      data: {
        onboardingStatus: 'COMPLETED',
        onboardingCompletedAt: new Date(),
        onboardingVersion: onboardingVersion ?? null,
        onboardingState: stateData,
      },
    })

    // Transition tenant PROVISIONED → ACTIVE; no-op for all other statuses.
    await tx.tenant.updateMany({
      where: { id: tenantId, status: 'PROVISIONED' },
      data: { status: 'ACTIVE' },
    })

    return updated
  })
}
