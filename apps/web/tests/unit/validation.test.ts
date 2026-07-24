import { describe, expect, it } from "vitest";
import { createSaudiMobileSchema } from "../../src/lib/validation";

const phoneSchema = createSaudiMobileSchema("required", "invalid");

describe("Saudi mobile validation", () => {
  it("accepts exactly 10 digits starting with 05", async () => {
    await expect(phoneSchema.validate("0512345678")).resolves.toBe("0512345678");
  });

  it.each([
    ["", "required"],
    ["051234567", "invalid"],
    ["05123456789", "invalid"],
    ["5412345678", "invalid"],
    ["0612345678", "invalid"],
    ["05abcdefgh", "invalid"],
  ])("rejects %j", async (phone, message) => {
    await expect(phoneSchema.validate(phone)).rejects.toThrow(message);
  });
});
