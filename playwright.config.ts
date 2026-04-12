import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  retries: 0,
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "node ./node_modules/next/dist/bin/next dev -p 3100",
        url: "http://127.0.0.1:3100",
        reuseExistingServer: false,
        timeout: 120_000,
        env: {
          ...process.env,
          KEON_TEST_ACTIVATION_TOKEN: process.env.KEON_TEST_ACTIVATION_TOKEN ?? "internal-test-token",
        },
      },
  use: {
    baseURL: process.env.BASE_URL ?? "http://127.0.0.1:3100",
    headless: true,
  },
});
