import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, isArabicLocale } from "../../src/lib/i18n";

describe("default locale", () => {
  it("uses Arabic for a first visit", () => {
    expect(DEFAULT_LOCALE).toBe("ar");
  });
});

describe("isArabicLocale", () => {
  it.each(["ar", "ar-SA", "ar-EG", "AR-sa"])("recognizes %s as RTL Arabic", (locale) => {
    expect(isArabicLocale(locale)).toBe(true);
  });

  it.each(["en", "en-US", undefined])("does not treat %s as Arabic", (locale) => {
    expect(isArabicLocale(locale)).toBe(false);
  });
});
