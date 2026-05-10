import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  completeOnboarding,
  WorkspaceNotFoundError,
  OnboardingAlreadyCompleteError,
} from '@/server/db/workspace'

vi.mock('@/server/db/client', () => ({
  db: {
    workspace: { findUnique: vi.fn(), update: vi.fn() },
    tenant: { updateMany: vi.fn() },
    $transaction: vi.fn(),
  },
}))

import { db } from '@/server/db/client'

const mockFindUnique = db.workspace.findUnique as ReturnType<typeof vi.fn>
const mockTransaction = db.$transaction as ReturnType<typeof vi.fn>

const WORKSPACE = {
  id: 'ws-1',
  externalId: 'ext-ws-1',
  tenantId: 'tenant-1',
  name: 'Acme Sandbox',
  environment: 'SANDBOX' as const,
  onboardingStatus: 'NOT_STARTED' as const,
  onboardingCompletedAt: null,
  onboardingVersion: null,
  onboardingState: {},
  createdAt: new Date(),
  updatedAt: new Date(),
}

const SNAPSHOT = {
  selectedGoals: ['govern-ai-actions'],
  guardrailPreset: 'balanced',
  selectedIntegrationMode: 'BYO_AI',
  onboardingVersion: '1.0',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('completeOnboarding', () => {
  it('throws WorkspaceNotFoundError when workspace not found', async () => {
    mockFindUnique.mockResolvedValue(null)
    await expect(
      completeOnboarding('tenant-1', 'missing-ws', SNAPSHOT),
    ).rejects.toThrow(WorkspaceNotFoundError)
    expect(mockTransaction).not.toHaveBeenCalled()
  })

  it('throws OnboardingAlreadyCompleteError when already COMPLETED', async () => {
    mockFindUnique.mockResolvedValue({ ...WORKSPACE, onboardingStatus: 'COMPLETED' })
    await expect(
      completeOnboarding('tenant-1', 'ext-ws-1', SNAPSHOT),
    ).rejects.toThrow(OnboardingAlreadyCompleteError)
    expect(mockTransaction).not.toHaveBeenCalled()
  })

  it('runs transaction and returns updated workspace on success', async () => {
    const updated = { ...WORKSPACE, onboardingStatus: 'COMPLETED' as const }
    mockFindUnique.mockResolvedValue(WORKSPACE)
    mockTransaction.mockImplementation(async (fn: (tx: typeof db) => Promise<unknown>) =>
      fn(db),
    )
    ;(db.workspace.update as ReturnType<typeof vi.fn>).mockResolvedValue(updated)
    ;(db.tenant.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 })

    const result = await completeOnboarding('tenant-1', 'ext-ws-1', SNAPSHOT)

    expect(result.onboardingStatus).toBe('COMPLETED')
    expect(mockTransaction).toHaveBeenCalledOnce()
  })

  it('passes correct workspace update data including onboardingVersion', async () => {
    const updated = { ...WORKSPACE, onboardingStatus: 'COMPLETED' as const }
    mockFindUnique.mockResolvedValue(WORKSPACE)
    mockTransaction.mockImplementation(async (fn: (tx: typeof db) => Promise<unknown>) =>
      fn(db),
    )
    ;(db.workspace.update as ReturnType<typeof vi.fn>).mockResolvedValue(updated)
    ;(db.tenant.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 0 })

    await completeOnboarding('tenant-1', 'ext-ws-1', SNAPSHOT)

    expect(db.workspace.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ws-1' },
        data: expect.objectContaining({
          onboardingStatus: 'COMPLETED',
          onboardingVersion: '1.0',
        }),
      }),
    )
  })

  it('targets PROVISIONED → ACTIVE transition with updateMany filter', async () => {
    const updated = { ...WORKSPACE, onboardingStatus: 'COMPLETED' as const }
    mockFindUnique.mockResolvedValue(WORKSPACE)
    mockTransaction.mockImplementation(async (fn: (tx: typeof db) => Promise<unknown>) =>
      fn(db),
    )
    ;(db.workspace.update as ReturnType<typeof vi.fn>).mockResolvedValue(updated)
    ;(db.tenant.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 0 })

    await completeOnboarding('tenant-1', 'ext-ws-1', SNAPSHOT)

    expect(db.tenant.updateMany).toHaveBeenCalledWith({
      where: { id: 'tenant-1', status: 'PROVISIONED' },
      data: { status: 'ACTIVE' },
    })
  })
})
