import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-ar", use: { ...devices["iPhone 13"], locale: "ar-SA" } },
    { name: "mobile-en", use: { ...devices["iPhone 13"], locale: "en-US" } },
  ],
  webServer: [
    {
      command: "npm run dev --workspace apps/api",
      url: "http://localhost:4000/api/v1/health",
      reuseExistingServer: !process.env.CI,
      // The e2e suite performs many auth calls across ~10 spec files
      // (each registering its own customer, some also logging in as
      // Admin); apps/api/src/middleware/rateLimit.ts already skips rate
      // limiting under NODE_ENV=test for the same reason the integration
      // suite needs it (vitest.integration.config.ts runs everything in
      // one shared process/store) — e2e needs the same bypass so a normal
      // full run doesn't trip the 5-requests/60s auth limiter.
      env: { NODE_ENV: "test" },
    },
    {
      command: "npm run dev --workspace apps/web",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
    },
  ],
});
