import i18n from "./i18n";
import arEnums from "../locales/ar/enums.json";

// FR-009/FR-010: UI code must never render a raw enum code. Every enum
// rendered anywhere in the app must go through this helper (or
// `enumOptions.ts`, which is built on top of it) so there is exactly one
// place that owns the code -> label mapping and the unmapped-code fallback.
export type EnumGroup = keyof typeof arEnums extends infer K ? Exclude<K, "unknown"> : never;

const GROUPS = Object.keys(arEnums).filter((key) => key !== "unknown") as EnumGroup[];

/**
 * Resolve a raw enum code (e.g. "SUSPENDED") to its locale-aware label.
 * Falls back to the `enums.unknown` translation and logs a development
 * warning when the code has no mapping, instead of ever rendering the
 * raw code to the user (FR-010).
 */
export function enumLabel(group: EnumGroup, code: string | null | undefined): string {
  if (!code) return i18n.t("enums:unknown");
  const label = i18n.t(`enums:${group}.${code}`, { defaultValue: "" });
  if (!label) {
    if (import.meta.env.DEV) {
      console.warn(`[enumLabels] Unmapped enum code "${code}" for group "${group}". Add it to locales/*/enums.json.`);
    }
    return i18n.t("enums:unknown");
  }
  return label;
}

export function isKnownEnumGroup(group: string): group is EnumGroup {
  return (GROUPS as string[]).includes(group);
}
