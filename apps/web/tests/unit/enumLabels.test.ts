import { describe, expect, it, afterEach } from "vitest";
import i18n from "../../src/lib/i18n";
import { enumLabel } from "../../src/lib/enumLabels";
import { enumOptions } from "../../src/lib/enumOptions";

describe("enumLabels", () => {
  const originalLanguage = i18n.language;

  afterEach(async () => {
    await i18n.changeLanguage(originalLanguage);
  });

  it("returns the Arabic label for a known code in Arabic mode", async () => {
    await i18n.changeLanguage("ar");
    expect(enumLabel("propertyType", "VILLA")).toBe("فيلا");
    expect(enumLabel("bookingStatus", "COMPLETED")).toBe("مكتمل");
  });

  it("returns the English label for a known code in English mode", async () => {
    await i18n.changeLanguage("en");
    expect(enumLabel("propertyType", "VILLA")).toBe("Villa");
    expect(enumLabel("bookingStatus", "COMPLETED")).toBe("Completed");
  });

  it("falls back to the unknown label for an unmapped code without throwing", async () => {
    await i18n.changeLanguage("ar");
    expect(enumLabel("propertyType", "NOT_A_REAL_CODE")).toBe("غير معروف");
  });

  it("falls back to the unknown label for a null/undefined code", async () => {
    await i18n.changeLanguage("ar");
    expect(enumLabel("bookingStatus", null)).toBe("غير معروف");
    expect(enumLabel("bookingStatus", undefined)).toBe("غير معروف");
  });

  it("keeps raw enum codes as option values while localizing only the label", async () => {
    await i18n.changeLanguage("ar");
    const options = enumOptions("propertyType", ["VILLA", "APARTMENT"]);
    expect(options).toEqual([
      { value: "VILLA", label: "فيلا" },
      { value: "APARTMENT", label: "شقة" },
    ]);
  });

  it("produces options for every code in a group when none are specified", async () => {
    await i18n.changeLanguage("en");
    const options = enumOptions("userStatus");
    expect(options.map((o) => o.value).sort()).toEqual(["ACTIVE", "INVITED", "SUSPENDED"]);
    expect(options.find((o) => o.value === "SUSPENDED")?.label).toBe("Suspended");
  });
});
