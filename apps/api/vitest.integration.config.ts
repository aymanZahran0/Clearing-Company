import { defineConfig } from "vitest/config";

// Requires a live PostgreSQL database at DATABASE_URL (see .env.example /
// quickstart.md). Not runnable in an environment without PostgreSQL —
// run via `npm run test:integration --workspace apps/api`.
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/integration/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
    fileParallelism: false,
  },
});
