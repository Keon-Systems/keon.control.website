import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  completeOnboarding,
  WorkspaceNotFoundError,
  WorkspaceForbiddenError,
  WorkspaceAmbiguousError,
  OnboardingAlreadyCompleteError,
} from '@/server/db/workspace'

vi.mock('@/server/db/client', () => ({
  db: {
    workspace: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    tenant: { updateMany: vi.fn() },
    $transaction: vi.fn(),
  },
}))

import { db } from '@/server/db/client'

const mockFindMany = db.workspace.findMany as ReturnType<typeof vi.fn>
const mockFindUnique = db.workspace.findUnique as ReturnType<typeof vi.fn>
const mockTransaction = db.$transaction as ReturnType<typeof vi.fn>

const WORKSPACE = {
  id: 'ws-id-1',
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

function setupSuccessTransaction() {
  const updated = { ...WORKSPACE, onboardingStatus: 'COMPLETED' as const }
  mockTransaction.mockImplementation(async (fn: (tx: typeof db) => Promise<unknown>) => fn(db))
  ;(db.workspace.update as ReturnType<typeof vi.fn>).mockResolvedValue(updated)
  ;(db.tenant.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 })
  return updated
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─────────────────────────────────────────────────────────────────────────────
// Default workspace resolution (workspaceExternalId = null)
// ─────────────────────────────────────────────────────────────────────────────

describe('completeOnboarding — default workspace resolution (null id)', () => {
  it('throws WorkspaceNotFoundError when tenant has no workspaces', async () => {
    mockFindMany.mockResolvedValue([])
    await expect(completeOnboarding('tenant-1', null, SNAPSHOT)).rejects.toThrow(
      WorkspaceNotFoundError,
    )
    expect(mockTransaction).not.toHaveBeenCalled()
  })

  it('throws WorkspaceAmbiguousError when tenant has multiple workspaces', async () => {
    mockFindMany.mockResolvedValue([WORKSPACE, { ...WORKSPACE, id: 'ws-id-2', externalId: 'ext-ws-2' }])
    await expect(completeOnboarding('tenant-1', null, SNAPSHOT)).rejects.toThrow(
      WorkspaceAmbiguousError,
    )
    expect(mockTransaction).not.toHaveBeenCalled()
  })

  it('completes successfully when tenant has exactly one workspace', async () => {
    mockFindMany.mockResolvedValue([WORKSPACE])
    const updated = setupSuccessTransaction()
    const result = await completeOnboarding('tenant-1', null, SNAPSHOT)
    expect(result.onboardingStatus).toBe('COMPLETED')
    expect(updated.onboardingStatus).toBe('COMPLETED')
    expect(mockTransaction).toHaveBeenCalledOnce()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Explicit workspace id
// ─────────────────────────────────────────────────────────────────────────────

describe('completeOnboarding — explicit workspaceExternalId', () => {
  it('throws WorkspaceForbiddenError when workspace not found under tenant', async () => {
    mockFindUnique.mockResolvedValue(null)
    await expect(completeOnboarding('tenant-1', 'foreign-ws', SNAPSHOT)).rejects.toThrow(
      WorkspaceForbiddenError,
    )
    expect(mockTransaction).not.toHaveBeenCalled()
  })

  it('throws OnboardingAlreadyCompleteError when already COMPLETED', async () => {
    mockFindUnique.mockResolvedValue({ ...WORKSPACE, onboardingStatus: 'COMPLETED' })
    await expect(completeOnboarding('tenant-1', 'ext-ws-1', SNAPSHOT)).rejects.toThrow(
      OnboardingAlreadyCompleteError,
    )
    expect(mockTransaction).not.toHaveBeenCalled()
  })

  it('completes successfully when workspace belongs to tenant', async () => {
    mockFindUnique.mockResolvedValue(WORKSPACE)
    setupSuccessTransaction()
    const result = await completeOnboarding('tenant-1', 'ext-ws-1', SNAPSHOT)
    expect(result.onboardingStatus).toBe('COMPLETED')
    expect(mockTransaction).toHaveBeenCalledOnce()
  })

  it('passes PROVISIONED → ACTIVE transition filter in transaction', async () => {
    mockFindUnique.mockResolvedValue(WORKSPACE)
    setupSuccessTransaction()
    await completeOnboarding('tenant-1', 'ext-ws-1', SNAPSHOT)
    expect(db.tenant.updateMany).toHaveBeenCalledWith({
      where: { id: 'tenant-1', status: 'PROVISIONED' },
      data: { status: 'ACTIVE' },
    })
  })
})
