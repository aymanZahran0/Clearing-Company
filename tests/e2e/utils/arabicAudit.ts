import type { Page } from "@playwright/test";
import arEnums from "../../../apps/web/src/locales/ar/enums.json";

// US4 scenario 6: every raw enum code from every group in enums.json is a
// known violation if it appears as visible text in Arabic mode — the UI
// must always go through enumLabels/enumOptions instead. Built from the
// same source of truth the app itself uses, so this list never drifts.
const RAW_ENUM_CODES = new Set<string>(
  Object.entries(arEnums as Record<string, unknown>)
    .filter(([group]) => group !== "unknown")
    .flatMap(([, values]) => Object.keys(values as Record<string, string>))
);

// A small set of known English-only labels that have leaked into the
// Arabic UI historically (T004 audit). Extend this list as new
// regressions are found — the goal is a fast regression guard, not
// perfect English-word detection (which would false-positive on English
// proper nouns like "WhatsApp" or "SAR").
const KNOWN_ENGLISH_LABELS = ["Property", "Address", "Add-ons", "Schedule", "Quote", "Confirm", "Rooms", "Area (sqm)"];

export interface ArabicAuditViolation {
  type: "raw-enum-code" | "known-english-label" | "missing-rtl-attrs";
  detail: string;
}

/**
 * Scans the current page for Arabic-localization regressions: raw enum
 * codes, known English-only labels, and incorrect `dir`/`lang` on `<html>`.
 * Returns an empty array when the page is clean.
 */
export async function auditPageForViolations(page: Page): Promise<ArabicAuditViolation[]> {
  const violations: ArabicAuditViolation[] = [];

  const [dir, lang] = await Promise.all([
    page.locator("html").getAttribute("dir"),
    page.locator("html").getAttribute("lang"),
  ]);
  if (dir !== "rtl" || lang !== "ar") {
    violations.push({ type: "missing-rtl-attrs", detail: `dir="${dir}" lang="${lang}"` });
  }

  const bodyText = await page.locator("body").innerText();
  const words = new Set(bodyText.match(/[A-Za-z][A-Za-z0-9_()-]*/g) ?? []);

  for (const word of words) {
    if (RAW_ENUM_CODES.has(word)) {
      violations.push({ type: "raw-enum-code", detail: word });
    }
  }
  for (const label of KNOWN_ENGLISH_LABELS) {
    if (bodyText.includes(label)) {
      violations.push({ type: "known-english-label", detail: label });
    }
  }

  return violations;
}
