/**
 * Shared integration-test DB helpers.
 *
 * This module owns a single PrismaClient instance used exclusively for test
 * setup/teardown (truncation, manual seed).  The service modules under test
 * use the `db` singleton from `@/server/db/client` — that's a separate
 * connection to the same database, which is intentional: tests exercise the
 * real service-layer path end-to-end.
 *
 * Usage in a test file:
 *
 *   import { prismaTest, cleanDb } from '../../setup/db'
 *
 *   beforeEach(cleanDb)
 *   afterAll(() => prismaTest.$disconnect())
 */

import { PrismaClient } from '@prisma/client'

export const prismaTest = new PrismaClient({
  log: ['error'],
})

/**
 * Truncate all application tables in dependency order, resetting sequences.
 * CASCADE handles FK dependencies so order only matters for performance.
 *
 * Tables without FKs to others (Tenant, User) go last; leaf tables first.
 * In practice CASCADE makes the order irrelevant, but explicit order is
 * self-documenting and slightly faster than letting Postgres chase FKs.
 */
export async function cleanDb(): Promise<void> {
  await prismaTest.$executeRawUnsafe(`
    TRUNCATE TABLE
      "InviteToken",
      "ProvisioningRun",
      "TenantMembership",
      "Workspace",
      "UserIdentity",
      "AccessRequest",
      "User",
      "Tenant"
    RESTART IDENTITY CASCADE
  `)
}
