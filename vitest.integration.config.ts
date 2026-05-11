import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('test'),
  },
  test: {
    // Node environment — integration tests hit real Postgres, not jsdom.
    environment: 'node',

    // DATABASE_URL must be set in .env before running.
    setupFiles: ['./tests/integration/setup/global.ts'],

    globals: true,

    include: ['tests/integration/**/*.test.ts'],

    // Real-DB round-trips are slow; give each test breathing room.
    testTimeout: 30_000,
    hookTimeout: 30_000,

    // Run test files serially — shared Postgres state must not interleave.
    // Individual tests within a file are also serial (default).
    sequence: { concurrent: false },
  },
  resolve: {
    alias: {
      // Same no-op shim as unit tests — service modules import 'server-only'
      // which is a Next.js marker; irrelevant in a raw Node test context.
      'server-only': path.resolve(__dirname, 'tests/unit/mocks/server-only.ts'),
      '@': path.resolve(__dirname, './src'),
    },
  },
})
