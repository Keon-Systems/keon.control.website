// Global setup file for integration tests.
// Validates DATABASE_URL is present so tests fail fast with a clear message
// rather than a cryptic Prisma connection error mid-suite.

if (!process.env.DATABASE_URL) {
  throw new Error(
    '[integration] DATABASE_URL is not set.\n' +
      'Set it in .env (Docker Postgres or Neon) before running test:integration.',
  )
}
