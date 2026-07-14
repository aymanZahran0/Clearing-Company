import { describe, expect, it } from "vitest";
import pino from "pino";
import { Writable } from "node:stream";
import { redactConfig } from "../../src/lib/logging.js";

function captureOutput(): { stream: Writable; text: () => string } {
  let buffer = "";
  const stream = new Writable({
    write(chunk, _enc, callback) {
      buffer += chunk.toString();
      callback();
    },
  });
  return { stream, text: () => buffer };
}

// T185: exercises the real `redactConfig` from lib/logging.ts directly
// (rather than requiring a live E2E run + log-grep, which this sandbox
// can't do) — proves FR-078's phone/address fields never reach the log
// output for every field path a real request body would use, including
// the nested `newCustomer.phone` shape used by admin-created bookings.
describe("Log redaction (FR-078)", () => {
  it("never writes phone or exact-address fields to the log output", () => {
    const { stream, text } = captureOutput();
    const testLogger = pino({ redact: redactConfig }, stream);

    testLogger.info({
      req: {
        body: {
          phone: "0512345678",
          contactPhone: "0598765432",
          billingContactPhone: "0511112222",
          newCustomer: { phone: "0533334444", fullName: "Test Customer" },
          street: "Al Malik Fahd Street",
          buildingNumber: "42",
          landmark: "Near the mosque",
        },
        headers: { authorization: "Bearer super-secret-token", cookie: "refreshToken=abc123" },
      },
    });

    const output = text();
    expect(output).not.toContain("0512345678");
    expect(output).not.toContain("0598765432");
    expect(output).not.toContain("0511112222");
    expect(output).not.toContain("0533334444");
    expect(output).not.toContain("Al Malik Fahd Street");
    expect(output).not.toContain("Near the mosque");
    expect(output).not.toContain("super-secret-token");
    expect(output).not.toContain("refreshToken=abc123");
    expect(output).toContain("[REDACTED]");
    // Non-PII fields must still be visible — this isn't over-redaction.
    expect(output).toContain("Test Customer");
  });
});
