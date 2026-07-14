import { randomBytes } from "node:crypto";

// FR-014: unique, customer-facing, human-readable reference (not a raw
// UUID). FR-077: a separate, unguessable verification token gates public
// lookup — the reference alone must never be sufficient.
export function generateBookingReference(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = randomBytes(3).toString("hex").toUpperCase();
  return `NA-${datePart}-${randomPart}`;
}

export function generateVerificationToken(): string {
  return randomBytes(24).toString("hex"); // 192 bits, unguessable
}
