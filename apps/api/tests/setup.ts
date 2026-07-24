import { afterAll, beforeEach } from "vitest";
import { prisma } from "../src/lib/prisma.js";

function assertDisposableTestDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required for integration tests");

  const databaseName = new URL(databaseUrl).pathname.replace(/^\//, "").toLowerCase();
  if (
    process.env.ALLOW_DATABASE_TRUNCATION !== "true" ||
    !databaseName.includes("test")
  ) {
    throw new Error(
      `Refusing to truncate database "${databaseName}". Use a database name containing "test" and set ALLOW_DATABASE_TRUNCATION=true.`
    );
  }
}

// Truncates all tables between tests so integration tests run against a
// real PostgreSQL test database (DATABASE_URL should point at a disposable
// test DB — see apps/api/.env.example) without leaking state between tests.
beforeEach(async () => {
  assertDisposableTestDatabase();
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public';
  `;
  const tableNames = tables
    .map(({ tablename }) => tablename)
    .filter((name) => name !== "_prisma_migrations")
    .map((name) => `"public"."${name}"`)
    .join(", ");

  if (tableNames.length > 0) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableNames} CASCADE;`);
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});
