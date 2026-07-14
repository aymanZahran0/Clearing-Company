import { describe, expect, it } from "vitest";
import { normalizeSaudiPhone } from "../../src/lib/phoneNormalization.js";

describe("normalizeSaudiPhone", () => {
  it("normalizes a local 05XXXXXXXX number", () => {
    expect(normalizeSaudiPhone("0512345678")).toBe("+966512345678");
  });

  it("normalizes an international +9665XXXXXXXX number", () => {
    expect(normalizeSaudiPhone("+966512345678")).toBe("+966512345678");
  });

  it("normalizes an international number without a leading plus", () => {
    expect(normalizeSaudiPhone("966512345678")).toBe("+966512345678");
  });

  it("normalizes a bare national number", () => {
    expect(normalizeSaudiPhone("512345678")).toBe("+966512345678");
  });

  it("strips spaces and dashes before validating", () => {
    expect(normalizeSaudiPhone("05 1234 5678")).toBe("+966512345678");
    expect(normalizeSaudiPhone("05-1234-5678")).toBe("+966512345678");
  });

  it("is idempotent: normalizing an already-normalized number returns the same value", () => {
    const normalized = normalizeSaudiPhone("0512345678");
    expect(normalizeSaudiPhone(normalized)).toBe(normalized);
  });

  it.each(["12345", "05123", "+1512345678", "0412345678", "not-a-phone", ""])(
    "rejects invalid input: %s",
    (input) => {
      expect(() => normalizeSaudiPhone(input)).toThrow();
    }
  );
});
