import { defineConfig } from "vitest/config";

// Unit tests only (tests/unit/**) — pure functions, no database required.
// Integration tests (tests/integration/**) run under vitest.integration.config.ts
// against a real PostgreSQL test database, per constitution ("integration
// tests must hit a real database, not mocks").
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/unit/**/*.test.ts"],
  },
});
