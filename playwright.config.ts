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
    },
    {
      command: "npm run dev --workspace apps/web",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
    },
  ],
});
