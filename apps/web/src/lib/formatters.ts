// Locale-aware formatting (constitution Principle III / FR-076). Currency
// is always SAR; amounts are received from the API as integer minor units
// (halalas) per data-model.md, so every formatter here divides by 100.

export function formatCurrency(minorUnits: number, locale: string): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    style: "currency",
    currency: "SAR",
  }).format(minorUnits / 100);
}

export function formatDate(date: string | Date, locale: string): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    dateStyle: "long",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date, locale: string): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

// Displays a normalized +9665XXXXXXXX number back in the locally familiar
// 05XXXXXXXX form; storage always keeps the E.164 form (data-model.md §1).
export function formatSaudiPhoneForDisplay(e164: string): string {
  const match = e164.match(/^\+966(5\d{8})$/);
  return match ? `0${match[1]}` : e164;
}
