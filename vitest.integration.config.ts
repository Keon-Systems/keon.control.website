import path from 'node:path'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

// loadEnv with an empty prefix loads ALL variables (not just VITE_-prefixed ones).
// This is required because Vitest only auto-injects VITE_* vars into worker processes;
// un-prefixed vars like DATABASE_URL need to be explicitly passed via test.env.
const env = loadEnv('test', process.cwd(), '')

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('test'),
  },
  test: {
    // Node environment — integration tests hit real Postgres, not jsdom.
    environment: 'node',

    // Inject all .env / .env.local vars into the worker process.
    env,

    setupFiles: ['./tests/integration/setup/global.ts'],

    globals: true,

    include: ['tests/integration/**/*.test.ts'],

    // Real-DB round-trips are slow; give each test breathing room.
    testTimeout: 30_000,
    hookTimeout: 30_000,

    // Run test files serially — shared Postgres state must not interleave.
    // sequence.concurrent only controls within-suite ordering; fileParallelism
    // is what prevents Vitest from forking concurrent workers per file.
    fileParallelism: false,
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
