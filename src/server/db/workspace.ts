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
 * Looks up the workspace by (tenantId, externalId). The caller must have already
 * verified tenant membership — this function does not re-check authorization.
 *
 * Atomically:
 *   1. Updates Workspace.onboardingStatus → COMPLETED
 *   2. Sets Workspace.onboardingCompletedAt, onboardingVersion, onboardingState
 *   3. Transitions Tenant.status PROVISIONED → ACTIVE (no-op for other statuses)
 *
 * Throws WorkspaceNotFoundError if the workspace doesn't exist or doesn't belong to the tenant.
 * Throws OnboardingAlreadyCompleteError if onboarding was already COMPLETED (idempotency guard).
 */
export async function completeOnboarding(
  tenantId: string,
  workspaceExternalId: string,
  snapshot: OnboardingSnapshot,
): Promise<Workspace> {
  const workspace = await db.workspace.findUnique({
    where: {
      tenantId_externalId: { tenantId, externalId: workspaceExternalId },
    },
  })

  if (!workspace) {
    throw new WorkspaceNotFoundError(tenantId, workspaceExternalId)
  }

  if (workspace.onboardingStatus === 'COMPLETED') {
    throw new OnboardingAlreadyCompleteError(workspaceExternalId)
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
