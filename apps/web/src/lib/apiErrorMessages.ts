import type { FetchBaseQueryError } from "@reduxjs/toolkit/query/react";

/**
 * Arabic/English translations for every static message string the API
 * throws via `ApiError` (apps/api/src, `packages/shared/src/api-contract/errors.ts`).
 * Keyed by the exact English message text so both sides stay in sync without
 * a shared runtime dependency between the two apps.
 */
const API_ERROR_MESSAGES: Record<string, { ar: string; en: string }> = {
  // auth
  "An account with this phone or email already exists": {
    ar: "يوجد حساب مسجل بالفعل بهذا الرقم أو البريد الإلكتروني",
    en: "An account with this phone or email already exists",
  },
  "Invalid credentials": {
    ar: "بيانات الدخول غير صحيحة",
    en: "Invalid credentials",
  },
  "This account has been suspended": {
    ar: "تم إيقاف هذا الحساب",
    en: "This account has been suspended",
  },
  "Invalid or expired refresh token": {
    ar: "انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى",
    en: "Invalid or expired refresh token",
  },
  "Refresh token has been revoked": {
    ar: "تم إلغاء هذه الجلسة، يرجى تسجيل الدخول مرة أخرى",
    en: "Refresh token has been revoked",
  },
  "Refresh token has expired": {
    ar: "انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى",
    en: "Refresh token has expired",
  },
  "Reset token is invalid or has expired": {
    ar: "رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية",
    en: "Reset token is invalid or has expired",
  },
  "Current password is incorrect": {
    ar: "كلمة المرور الحالية غير صحيحة",
    en: "Current password is incorrect",
  },
  "Missing or invalid Authorization header": {
    ar: "يجب تسجيل الدخول للمتابعة",
    en: "Missing or invalid Authorization header",
  },
  "Invalid or expired access token": {
    ar: "انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى",
    en: "Invalid or expired access token",
  },
  "Authentication required": {
    ar: "يجب تسجيل الدخول للمتابعة",
    en: "Authentication required",
  },
  "You do not have permission to perform this action": {
    ar: "ليس لديك صلاحية للقيام بهذا الإجراء",
    en: "You do not have permission to perform this action",
  },

  // bookings
  "Idempotency-Key header is required": {
    ar: "طلب غير صالح، يرجى إعادة المحاولة",
    en: "Idempotency-Key header is required",
  },
  "Booking not found": { ar: "الحجز غير موجود", en: "Booking not found" },
  "customerId or newCustomer is required": {
    ar: "بيانات العميل مطلوبة",
    en: "customerId or newCustomer is required",
  },
  "Quote not found": { ar: "عرض السعر غير موجود", en: "Quote not found" },
  "This quote has expired; request a new estimate": {
    ar: "انتهت صلاحية عرض السعر هذا، يرجى طلب عرض سعر جديد",
    en: "This quote has expired; request a new estimate",
  },
  "Address not found": { ar: "العنوان غير موجود", en: "Address not found" },
  "Invalid verification token": {
    ar: "رمز التحقق غير صالح",
    en: "Invalid verification token",
  },
  "Booking has no price to confirm": {
    ar: "لا يوجد سعر لهذا الحجز لتأكيده",
    en: "Booking has no price to confirm",
  },
  "priceOverrideReason is required when overriding price": {
    ar: "يجب إدخال سبب تجاوز السعر",
    en: "priceOverrideReason is required when overriding price",
  },
  "Only confirmed bookings can be scheduled": {
    ar: "يمكن جدولة الحجوزات المؤكدة فقط",
    en: "Only confirmed bookings can be scheduled",
  },
  "Booking is already scheduled; use reschedule instead": {
    ar: "تمت جدولة هذا الحجز بالفعل، استخدم إعادة الجدولة بدلاً من ذلك",
    en: "Booking is already scheduled; use reschedule instead",
  },
  "Time slot not found": {
    ar: "الموعد غير موجود",
    en: "Time slot not found",
  },
  "This time slot is at full capacity": {
    ar: "هذا الموعد ممتلئ بالكامل",
    en: "This time slot is at full capacity",
  },
  "Booking has not been scheduled yet; use schedule instead": {
    ar: "لم تتم جدولة هذا الحجز بعد، استخدم الجدولة بدلاً من ذلك",
    en: "Booking has not been scheduled yet; use schedule instead",
  },
  "Only confirmed bookings can be marked en route": {
    ar: "يمكن تحديد \"في الطريق\" للحجوزات المؤكدة فقط",
    en: "Only confirmed bookings can be marked en route",
  },
  "Only confirmed bookings can be marked arrived": {
    ar: "يمكن تحديد \"تم الوصول\" للحجوزات المؤكدة فقط",
    en: "Only confirmed bookings can be marked arrived",
  },
  "Cannot start before arrival is recorded": {
    ar: "لا يمكن بدء التنفيذ قبل تسجيل الوصول",
    en: "Cannot start before arrival is recorded",
  },
  "This booking is not in a reschedulable state": {
    ar: "لا يمكن إعادة جدولة هذا الحجز في حالته الحالية",
    en: "This booking is not in a reschedulable state",
  },
  "A reschedule request is already pending for this booking": {
    ar: "يوجد بالفعل طلب إعادة جدولة معلّق لهذا الحجز",
    en: "A reschedule request is already pending for this booking",
  },
  "Reschedule request not found or already decided": {
    ar: "طلب إعادة الجدولة غير موجود أو تم البت فيه بالفعل",
    en: "Reschedule request not found or already decided",
  },

  // customers
  "Customer not found": {
    ar: "العميل غير موجود",
    en: "Customer not found",
  },
  "Customer profile not found": {
    ar: "الملف الشخصي للعميل غير موجود",
    en: "Customer profile not found",
  },
  "This Customer is already suspended": {
    ar: "هذا العميل موقوف بالفعل",
    en: "This Customer is already suspended",
  },
  "This Customer is not currently suspended": {
    ar: "هذا العميل غير موقوف حالياً",
    en: "This Customer is not currently suspended",
  },
  "A customer with booking history cannot be deleted": {
    ar: "لا يمكن حذف عميل لديه طلبات",
    en: "Customers with requests cannot be deleted",
  },

  // pricing / discounts
  "Pricing rule not found": {
    ar: "قاعدة التسعير غير موجودة",
    en: "Pricing rule not found",
  },
  "Discount code not found": {
    ar: "كود الخصم غير موجود",
    en: "Discount code not found",
  },
  "Discount code is invalid, expired, or has reached its usage limit": {
    ar: "كود الخصم غير صالح أو منتهي الصلاحية أو وصل للحد الأقصى للاستخدام",
    en: "Discount code is invalid, expired, or has reached its usage limit",
  },
  "Order does not meet this code's minimum value": {
    ar: "قيمة الطلب لا تصل إلى الحد الأدنى المطلوب لهذا الكود",
    en: "Order does not meet this code's minimum value",
  },

  // commercial
  "Commercial account not found": {
    ar: "الحساب التجاري غير موجود",
    en: "Commercial account not found",
  },
  "Contract not found": { ar: "العقد غير موجود", en: "Contract not found" },

  // service areas / addresses
  "Service area not found": {
    ar: "المنطقة الخدمية غير موجودة",
    en: "Service area not found",
  },
  "This area is not currently serviced": {
    ar: "لا تشمل خدماتنا هذه المنطقة حالياً",
    en: "This area is not currently serviced",
  },

  // admin accounts
  "An account with this email already exists": {
    ar: "يوجد حساب مسجل بالفعل بهذا البريد الإلكتروني",
    en: "An account with this email already exists",
  },
  "This Admin account is not currently active": {
    ar: "هذا الحساب الإداري غير نشط حالياً",
    en: "This Admin account is not currently active",
  },
  "Cannot suspend the last active Admin account": {
    ar: "لا يمكن إيقاف آخر حساب إداري نشط",
    en: "Cannot suspend the last active Admin account",
  },
  "This Admin account is not currently suspended": {
    ar: "هذا الحساب الإداري غير موقوف حالياً",
    en: "This Admin account is not currently suspended",
  },

  // catalog / services
  "Service not found": { ar: "الخدمة غير موجودة", en: "Service not found" },
  "addressId or serviceAreaId is required": {
    ar: "يجب تحديد العنوان أو المنطقة الخدمية",
    en: "addressId or serviceAreaId is required",
  },
  "A service with this slug already exists": {
    ar: "توجد خدمة بهذا المعرف بالفعل",
    en: "A service with this slug already exists",
  },
  "A category with this slug already exists": {
    ar: "توجد فئة بهذا المعرف بالفعل",
    en: "A category with this slug already exists",
  },
  "Service category not found": {
    ar: "فئة الخدمة غير موجودة",
    en: "Service category not found",
  },
  "Cannot delete a category that contains services": {
    ar: "لا يمكن حذف فئة تحتوي على خدمات",
    en: "Cannot delete a category that contains services",
  },
  "Add-on not found": {
    ar: "الإضافة غير موجودة",
    en: "Add-on not found",
  },
  "Cannot delete a service used by bookings or quotes": {
    ar: "لا يمكن حذف خدمة مستخدمة في حجوزات أو عروض أسعار",
    en: "Cannot delete a service used by bookings or quotes",
  },

  // reviews / complaints
  "Only completed bookings can be reviewed": {
    ar: "يمكن تقييم الحجوزات المكتملة فقط",
    en: "Only completed bookings can be reviewed",
  },
  "This booking has already been reviewed": {
    ar: "تم تقييم هذا الحجز بالفعل",
    en: "This booking has already been reviewed",
  },
  "Quality issue not found": {
    ar: "مشكلة الجودة غير موجودة",
    en: "Quality issue not found",
  },
  "resolution is required before closing a quality issue": {
    ar: "يجب إدخال طريقة الحل قبل إغلاق مشكلة الجودة",
    en: "resolution is required before closing a quality issue",
  },
  "A rework booking already exists for this issue": {
    ar: "يوجد بالفعل حجز إعادة تنفيذ لهذه المشكلة",
    en: "A rework booking already exists for this issue",
  },
  "Original booking not found": {
    ar: "الحجز الأصلي غير موجود",
    en: "Original booking not found",
  },

  // content
  "Content block not found": {
    ar: "عنصر المحتوى غير موجود",
    en: "Content block not found",
  },
  "FAQ item not found": {
    ar: "سؤال الأسئلة الشائعة غير موجود",
    en: "FAQ item not found",
  },

  // subscriptions
  "Subscription not found": {
    ar: "الاشتراك غير موجود",
    en: "Subscription not found",
  },
  "This occurrence already has a booking; cancel it directly instead": {
    ar: "يوجد بالفعل حجز لهذه الجلسة، ألغِ الحجز مباشرة بدلاً من ذلك",
    en: "This occurrence already has a booking; cancel it directly instead",
  },

  // checklists
  "No checklist template configured for this service": {
    ar: "لا يوجد قالب قائمة تحقق لهذه الخدمة",
    en: "No checklist template configured for this service",
  },
  "Booking has no primary service item": {
    ar: "لا يحتوي هذا الحجز على عنصر خدمة أساسي",
    en: "Booking has no primary service item",
  },
  "This checklist run is already complete": {
    ar: "قائمة التحقق هذه مكتملة بالفعل",
    en: "This checklist run is already complete",
  },
  "No checklist run for this booking": {
    ar: "لا توجد قائمة تحقق لهذا الحجز",
    en: "No checklist run for this booking",
  },
  "Checklist has not been started for this booking": {
    ar: "لم تبدأ قائمة التحقق لهذا الحجز بعد",
    en: "Checklist has not been started for this booking",
  },
  "Required checklist items are outstanding": {
    ar: "توجد عناصر مطلوبة في قائمة التحقق لم تُستكمل بعد",
    en: "Required checklist items are outstanding",
  },

  // service images
  "An image file is required (field name: image)": {
    ar: "يجب إرفاق صورة",
    en: "An image file is required (field name: image)",
  },
  "Only JPEG, PNG, and WebP images are allowed": {
    ar: "يُسمح فقط بصور JPEG أو PNG أو WebP",
    en: "Only JPEG, PNG, and WebP images are allowed",
  },
  "Image must be 5MB or smaller": {
    ar: "يجب ألا يتجاوز حجم الصورة 5 ميجابايت",
    en: "Image must be 5MB or smaller",
  },
  "Image not found": { ar: "الصورة غير موجودة", en: "Image not found" },

  // rate limiting / generic
  "Too many requests. Please try again shortly.": {
    ar: "عدد كبير من المحاولات، يرجى المحاولة بعد قليل",
    en: "Too many requests. Please try again shortly.",
  },
  "Request failed validation": {
    ar: "البيانات المدخلة غير صحيحة، يرجى مراجعتها والمحاولة مرة أخرى",
    en: "Request failed validation",
  },
  "An unexpected error occurred": {
    ar: "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى",
    en: "An unexpected error occurred",
  },
};

const GENERIC_FALLBACK = {
  ar: "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى",
  en: "An unexpected error occurred, please try again",
};

const NETWORK_ERROR = {
  ar: "تعذر الاتصال بالخادم، يرجى التحقق من اتصالك بالإنترنت",
  en: "Unable to connect to the server, please check your internet connection",
};

// Prefix matches for the handful of backend messages that interpolate a
// runtime value (bookingStateMachine.ts, lib/params.ts) and so can't be
// looked up by exact text.
const DYNAMIC_MESSAGE_PREFIXES = ["Cannot move a booking from", "Missing required route parameter"];

function pick(entry: { ar: string; en: string }, lang: string): string {
  return lang.startsWith("ar") ? entry.ar : entry.en;
}

/**
 * Translates a rejected RTK Query error (from baseApi's fetchBaseQuery) into
 * a user-facing message in the given language, using the backend's real
 * message where we have a translation and a generic fallback otherwise.
 */
export function translateApiError(error: FetchBaseQueryError | undefined, lang: string): string {
  if (!error) return pick(GENERIC_FALLBACK, lang);

  if (error.status === "FETCH_ERROR" || error.status === "TIMEOUT_ERROR" || error.status === "PARSING_ERROR") {
    return pick(NETWORK_ERROR, lang);
  }

  const backendMessage = (error.data as { error?: { message?: string } } | undefined)?.error?.message;
  if (!backendMessage) return pick(GENERIC_FALLBACK, lang);

  const known = API_ERROR_MESSAGES[backendMessage];
  if (known) return pick(known, lang);

  if (DYNAMIC_MESSAGE_PREFIXES.some((prefix) => backendMessage.startsWith(prefix))) {
    return pick(GENERIC_FALLBACK, lang);
  }

  return pick(GENERIC_FALLBACK, lang);
}
