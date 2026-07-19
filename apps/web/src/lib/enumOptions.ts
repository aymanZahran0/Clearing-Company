import arEnums from "../locales/ar/enums.json";
import { enumLabel, type EnumGroup } from "./enumLabels";

export interface EnumOption {
  value: string;
  label: string;
}

/**
 * Build Ant Design-compatible `{value, label}` options for a `<Select>`/
 * `<Radio.Group>` etc. `value` always stays the raw API enum code (D2);
 * only `label` is localized. Pass `codes` to restrict/order a subset
 * (e.g. only the statuses reachable from a given state); omit it to use
 * every known code for the group, in schema declaration order.
 */
export function enumOptions(group: EnumGroup, codes?: readonly string[]): EnumOption[] {
  const groups = arEnums as unknown as Record<EnumGroup, Record<string, string>>;
  const source = codes ?? Object.keys(groups[group] ?? {});
  return source.map((value) => ({ value, label: enumLabel(group, value) }));
}
