// Public click-to-chat number for the website. wa.me expects the
// international number without a leading plus.
export const WHATSAPP_NUMBER = "+966502266402";

// Same number, formatted for display (e.g. the footer's "call us" link).
export const CONTACT_PHONE_DISPLAY = "+966 50 226 6402";

export function buildWhatsAppUrl(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
