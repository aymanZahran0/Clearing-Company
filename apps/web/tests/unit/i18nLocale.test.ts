import { describe, expect, it } from "vitest";
import { isArabicLocale } from "../../src/lib/i18n";

describe("isArabicLocale", () => {
  it.each(["ar", "ar-SA", "ar-EG", "AR-sa"])("recognizes %s as RTL Arabic", (locale) => {
    expect(isArabicLocale(locale)).toBe(true);
  });

  it.each(["en", "en-US", undefined])("does not treat %s as Arabic", (locale) => {
    expect(isArabicLocale(locale)).toBe(false);
  });
});
