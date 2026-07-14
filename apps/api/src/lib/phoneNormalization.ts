/**
 * Normalizes a Saudi mobile number to E.164 (+9665XXXXXXXX).
 * Accepts local (05XXXXXXXX), international with plus (+9665XXXXXXXX),
 * or international without plus (9665XXXXXXXX).
 * Throws if the input doesn't match a recognizable Saudi mobile shape.
 */
export function normalizeSaudiPhone(input: string): string {
  const digitsOnly = input.trim().replace(/[\s-]/g, "");

  let national: string | null = null;

  if (/^05\d{8}$/.test(digitsOnly)) {
    national = digitsOnly.slice(1); // drop leading 0
  } else if (/^\+9665\d{8}$/.test(digitsOnly)) {
    national = digitsOnly.slice(4); // drop +966
  } else if (/^9665\d{8}$/.test(digitsOnly)) {
    national = digitsOnly.slice(3); // drop 966
  } else if (/^5\d{8}$/.test(digitsOnly)) {
    national = digitsOnly;
  }

  if (!national) {
    throw new Error(`Not a valid Saudi mobile number: ${input}`);
  }

  return `+966${national}`;
}
