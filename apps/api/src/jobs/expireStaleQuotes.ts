import { prisma } from "../lib/prisma.js";

// Idempotent: only touches quotes still `ACTIVE` past their `expiresAt`, so
// re-running the same minute twice is a no-op after the first pass.
export async function expireStaleQuotes(now: Date = new Date()) {
  const result = await prisma.quote.updateMany({
    where: { status: "ACTIVE", expiresAt: { lt: now } },
    data: { status: "EXPIRED" },
  });
  return { expired: result.count };
}
