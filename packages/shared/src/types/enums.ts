// Core enums shared between apps/web and apps/api, matching data-model.md.

export const Role = {
  CUSTOMER: "CUSTOMER",
  ADMIN: "ADMIN",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const UserStatus = {
  ACTIVE: "ACTIVE",
  INVITED: "INVITED",
  SUSPENDED: "SUSPENDED",
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

// research.md R5: exact status list directed by /speckit-plan. Finer-grained
// execution sub-states (en route/arrived/started, checklist review) live as
// separate timestamp/child-record fields on Booking, not as extra values here.
export const BookingStatus = {
  DRAFT: "DRAFT",
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  RESCHEDULED: "RESCHEDULED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  REJECTED: "REJECTED",
  COMPLAINT_OPENED: "COMPLAINT_OPENED",
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const BookingSource = {
  WEB: "WEB",
  ADMIN_PHONE: "ADMIN_PHONE",
} as const;
export type BookingSource = (typeof BookingSource)[keyof typeof BookingSource];

export const PropertyType = {
  APARTMENT: "APARTMENT",
  VILLA: "VILLA",
  OFFICE: "OFFICE",
  SHOP: "SHOP",
  CLINIC: "CLINIC",
  FURNISHED_UNIT: "FURNISHED_UNIT",
  OTHER: "OTHER",
} as const;
export type PropertyType = (typeof PropertyType)[keyof typeof PropertyType];

export const PricingType = {
  FIXED: "FIXED",
  PROPERTY_SIZE: "PROPERTY_SIZE",
  HOURLY: "HOURLY",
  QUANTITY: "QUANTITY",
  CUSTOM_QUOTE: "CUSTOM_QUOTE",
} as const;
export type PricingType = (typeof PricingType)[keyof typeof PricingType];

export const PaymentMethod = {
  CASH: "CASH",
  BANK_TRANSFER: "BANK_TRANSFER",
  POS: "POS",
  COMPLIMENTARY: "COMPLIMENTARY",
  OTHER: "OTHER",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PaymentStatus = {
  UNPAID: "UNPAID",
  PARTIALLY_PAID: "PARTIALLY_PAID",
  PAID: "PAID",
  REFUNDED_RECORDED: "REFUNDED_RECORDED",
  WAIVED: "WAIVED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const NotificationChannel = {
  WHATSAPP: "WHATSAPP",
  SMS: "SMS",
  EMAIL: "EMAIL",
} as const;
export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];

export const QualityIssueSource = {
  REVIEW: "REVIEW",
  COMPLAINT: "COMPLAINT",
  CHECKLIST_FAILURE: "CHECKLIST_FAILURE",
} as const;
export type QualityIssueSource = (typeof QualityIssueSource)[keyof typeof QualityIssueSource];

export const QualityIssueStatus = {
  OPEN: "OPEN",
  IN_REVIEW: "IN_REVIEW",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
} as const;
export type QualityIssueStatus = (typeof QualityIssueStatus)[keyof typeof QualityIssueStatus];

export const SubscriptionFrequency = {
  WEEKLY: "WEEKLY",
  BIWEEKLY: "BIWEEKLY",
  MONTHLY: "MONTHLY",
  CUSTOM: "CUSTOM",
} as const;
export type SubscriptionFrequency = (typeof SubscriptionFrequency)[keyof typeof SubscriptionFrequency];

export const SubscriptionStatus = {
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  CANCELLED: "CANCELLED",
} as const;
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const ChecklistItemType = {
  YES_NO: "YES_NO",
  TEXT: "TEXT",
  NUMBER: "NUMBER",
  SIGNATURE: "SIGNATURE",
  ISSUE_FLAG: "ISSUE_FLAG",
} as const;
export type ChecklistItemType = (typeof ChecklistItemType)[keyof typeof ChecklistItemType];
