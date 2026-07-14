# Phase 1 Data Model: Nuqaa Asir Cleaning Booking & Operations Platform

Derived from `spec.md` Key Entities, adapted to the two-role model (Customer / Admin) and the explicit module list from `/speckit-plan`. Field lists are implementation-ready for a Prisma schema; exact Prisma syntax is left to the implementation phase, but types, nullability, relationships, and constraints below are authoritative.

Conventions: all `id` fields are UUIDv7 (sortable, non-guessable). All entities have `createdAt`/`updatedAt` unless noted. Money fields are integer minor units (halalas) to avoid floating-point error. All `*Ar`/`*En` field pairs back the bilingual requirement (FR-075).

---

## 1. User

Authentication/account record for both roles.

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| email | string, unique, nullable | required for ADMIN; optional for CUSTOMER (phone-first) |
| phoneNormalized | string, unique per role, nullable | E.164 Saudi format; required for CUSTOMER |
| passwordHash | string, nullable | null for Admin-created customer accounts not yet claimed (R6) |
| role | enum `CUSTOMER` \| `ADMIN` | FR-001 |
| status | enum `ACTIVE` \| `INVITED` \| `SUSPENDED` | INVITED = Admin-created, no password yet |
| lastLoginAt | datetime, nullable | |
| refreshTokenVersion | int, default 0 | incremented to invalidate all outstanding refresh tokens |

**Validation**: email valid format when present; phone must normalize to a valid Saudi mobile pattern; exactly one of `email`/`phone` required at minimum for CUSTOMER.
**Indexes**: unique(email) where not null, unique(phoneNormalized) where not null, index(role).

## 2. CustomerProfile

1:1 extension of `User` where `role = CUSTOMER`.

| Field | Type | Notes |
|---|---|---|
| userId | UUID, PK, FK → User | |
| fullName | string | |
| preferredChannel | enum `PHONE` \| `WHATSAPP` \| `EMAIL` | |
| marketingConsent | boolean, default false | |
| customerType | enum `INDIVIDUAL` \| `COMMERCIAL` | |
| tags | string[] | e.g. VIP, complaint-history, referral-partner (FR-043) |
| internalNotes | text, nullable | Admin-only, never customer-visible (FR-042) |
| commercialAccountId | UUID, nullable, FK → CommercialAccount | |

## 3. CustomerAddress

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| customerId | UUID, FK → CustomerProfile | |
| label | string, nullable | e.g. "Home", "Office" |
| city | string | |
| neighborhood | string | |
| street | string, nullable | |
| buildingNumber | string, nullable | |
| unitNumber | string, nullable | |
| landmark | string, nullable | |
| latitude / longitude | decimal, nullable | |
| mapUrl | string, nullable | |
| serviceAreaId | UUID, FK → ServiceArea | |
| isDefault | boolean, default false | |

**Validation**: `serviceAreaId` must reference an `active = true` ServiceArea (FR-012).

## 4. ServiceArea

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| nameAr / nameEn | string | |
| city | string | |
| travelFee | int (minor units) | FR-023 |
| active | boolean | |

## 5. ServiceCategory

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| nameAr / nameEn | string | |
| slug | string, unique | |
| sortOrder | int | |
| active | boolean | |

## 6. Service

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| categoryId | UUID, FK → ServiceCategory | |
| nameAr / nameEn | string | |
| descriptionAr / descriptionEn | text | |
| slug | string, unique | for SEO-friendly public URLs |
| pricingType | enum `FIXED` \| `PROPERTY_SIZE` \| `HOURLY` \| `QUANTITY` \| `CUSTOM_QUOTE` | R7 |
| basePrice | int (minor units), nullable | null when `pricingType = CUSTOM_QUOTE` |
| minimumPrice | int, nullable | |
| defaultDurationMinutes | int | |
| requiresManualQuote | boolean | FR-020 |
| active | boolean | FR-009 |

## 7. ServiceImage

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| serviceId | UUID, FK → Service | |
| url | string | object-storage URL (R4) |
| altTextAr / altTextEn | string | |
| sortOrder | int | |

**Validation**: MIME type restricted to image/jpeg, image/png, image/webp; max 5MB; server-side re-encode/strip EXIF before storage.

## 8. ServiceAddOn

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| serviceId | UUID, FK → Service | |
| nameAr / nameEn | string | |
| pricingMode | enum `FIXED` \| `PER_QUANTITY` | |
| unitPrice | int (minor units) | |
| durationImpactMinutes | int, default 0 | |
| active | boolean | |

## 9. PricingRule

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| serviceId | UUID, FK → Service | |
| ruleType | enum `PROPERTY_TYPE` \| `AREA_BAND` \| `DAY_TIME` \| `CONDITION_MODIFIER` | |
| conditionsJson | jsonb | structured predicate |
| calculationType | enum `PERCENTAGE` \| `FIXED_AMOUNT` | |
| amount | decimal | |
| priority | int | evaluation order |
| startsAt / endsAt | datetime, nullable | |
| active | boolean | |

## 10. DiscountCode

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| code | string, unique | |
| type | enum `PERCENTAGE` \| `FIXED` | |
| amount | decimal | |
| minOrderValue | int, nullable | |
| validFrom / validTo | datetime | FR-022 |
| usageLimit | int, nullable | |
| usageCount | int, default 0 | |
| active | boolean | |
| createdByUserId | UUID, FK → User | Admin only |

## 11. Quote

Represents the pre-confirmation price estimate produced during the booking wizard, before a `Booking` exists.

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| customerId | UUID, nullable, FK → CustomerProfile | nullable until account/session resolved |
| serviceId | UUID, FK → Service | |
| addOnIds | UUID[] | |
| propertyType | enum (see Booking) | |
| propertySizeInput | jsonb | rooms/area, per FR-010 |
| addressId | UUID, nullable, FK → CustomerAddress | |
| requestedDate | date | |
| requestedTimeSlotId | UUID, nullable, FK → TimeSlot | |
| priceBreakdownJson | jsonb | subtotal, addOns, discount, travelFee, tax, total |
| requiresManualReview | boolean | FR-020 |
| discountCodeId | UUID, nullable, FK → DiscountCode | |
| status | enum `ACTIVE` \| `EXPIRED` \| `CONVERTED` | |
| expiresAt | datetime | |

## 12. Booking

Central operational record.

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| referenceNumber | string, unique, human-friendly | FR-014 |
| customerId | UUID, FK → CustomerProfile | |
| addressId | UUID, FK → CustomerAddress | |
| quoteId | UUID, nullable, FK → Quote | |
| source | enum `WEB` \| `ADMIN_PHONE` | User Story 1 vs. 2 |
| status | enum `DRAFT` \| `PENDING` \| `CONFIRMED` \| `RESCHEDULED` \| `IN_PROGRESS` \| `COMPLETED` \| `CANCELLED` \| `REJECTED` \| `COMPLAINT_OPENED` | R5 |
| propertyType | enum `APARTMENT` \| `VILLA` \| `OFFICE` \| `SHOP` \| `CLINIC` \| `FURNISHED_UNIT` \| `OTHER` | FR-010 |
| propertyDetailsJson | jsonb | rooms, size, condition modifiers (FR-011) |
| customerNotes | text, nullable | |
| preferredDate / preferredTimeSlotId | date / FK, nullable | customer's original request |
| scheduledStartAt / scheduledEndAt | datetime, nullable | set by Admin (FR-029) |
| internalHandlingNote | text, nullable | free-text only, no staff/team FK (FR-029) |
| enRouteAt / arrivedAt / startedAt / completedAt | datetime, nullable | R5 |
| subtotalSnapshot / discountSnapshot / travelFeeSnapshot / taxSnapshot / totalSnapshot | int (minor units) | FR-024, immutable once set |
| currency | string, default `SAR` | |
| discountCodeId | UUID, nullable, FK → DiscountCode | |
| quoteExpiresAt | datetime, nullable | |
| cancellationReason | text, nullable | includes `no_show` as a reason value, not a separate status (R5) |
| cancelledByRole | enum `CUSTOMER` \| `ADMIN`, nullable | |
| rejectionReason | text, nullable | |
| originalBookingId | UUID, nullable, FK → Booking (self) | set on rework bookings (FR-053) |
| subscriptionId | UUID, nullable, FK → Subscription | |
| createdByUserId | UUID, FK → User | Admin user if `source = ADMIN_PHONE` |

**State-transition rules** (enforced server-side, FR-034–FR-040):
- `PENDING → CONFIRMED` requires price, address, service date, and valid contact (FR-034).
- `CONFIRMED → IN_PROGRESS` requires `scheduledStartAt`/`scheduledEndAt` set (FR-035) and `arrivedAt` populated before entering IN_PROGRESS (FR-036).
- `IN_PROGRESS → COMPLETED` requires all `ChecklistTemplateItem.required = true` items answered (FR-036, FR-048) and `completedAt` set.
- `* → CANCELLED` requires `cancellationReason` and `cancelledByRole` (FR-037); no fee logic applied regardless of timing (FR-040).
- `PENDING → REJECTED` requires `rejectionReason`.
- `COMPLETED → COMPLAINT_OPENED` set automatically when a linked `QualityIssue` is created against a completed booking; cleared back implicitly once the issue's status is `RESOLVED`/`CLOSED` (booking `status` remains `COMPLETED` again, issue keeps its own status).
- Every transition writes a `BookingStatusHistory` row (FR-038).

**Indexes**: unique(referenceNumber), index(customerId), index(status), index(scheduledStartAt).

## 13. BookingItem

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| bookingId | UUID, FK → Booking | |
| serviceId | UUID, FK → Service | |
| addOnId | UUID, nullable, FK → ServiceAddOn | |
| descriptionSnapshot | string | |
| quantity | int, default 1 | |
| unitPriceSnapshot / totalSnapshot | int (minor units) | |
| durationMinutesSnapshot | int | |

## 14. BookingStatusHistory

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| bookingId | UUID, FK → Booking | |
| fromStatus / toStatus | enum | |
| reason | text, nullable | |
| actorUserId | UUID, FK → User | |
| createdAt | datetime | |

## 15. OperatingHours / ClosedDate / TimeSlot

| Entity | Key Fields |
|---|---|
| OperatingHours | id, weekday (0–6), openTime, closeTime, active |
| ClosedDate | id, date, reason |
| TimeSlot | id, date, startTime, endTime, capacity (int), bookedCount (int, maintained transactionally), active |

**Validation**: `TimeSlot.bookedCount <= capacity` enforced at booking-scheduling time (FR-030); exceeding it requires an explicit Admin override flag recorded on the triggering `BookingStatusHistory`/`AuditLog` entry.

## 16. ChecklistTemplate / ChecklistTemplateItem

| Entity | Key Fields |
|---|---|
| ChecklistTemplate | id, serviceId (FK), version (int), active |
| ChecklistTemplateItem | id, templateId (FK), label, type (`YES_NO`\|`TEXT`\|`NUMBER`\|`SIGNATURE`\|`ISSUE_FLAG`), required (bool), sortOrder |

Photo item type intentionally excluded (spec.md Clarifications, photo capture out of scope).

## 17. ChecklistRun / ChecklistResult

| Entity | Key Fields |
|---|---|
| ChecklistRun | id, bookingId (FK, unique), templateId (FK), templateVersionSnapshot (int), completedByUserId (FK → User, Admin), completedAt, reviewedByUserId (FK → User), reviewedAt |
| ChecklistResult | id, checklistRunId (FK), templateItemId (FK), value (jsonb), isIssue (bool), issueNote (text, nullable) |

## 18. QualityIssue

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| bookingId | UUID, FK → Booking | |
| source | enum `REVIEW` \| `COMPLAINT` \| `CHECKLIST_FAILURE` | |
| category | string | |
| severity | enum `LOW` \| `MEDIUM` \| `HIGH` | |
| description | text | |
| status | enum `OPEN` \| `IN_REVIEW` \| `RESOLVED` \| `CLOSED` | |
| ownerUserId | UUID, FK → User (Admin) | |
| resolution | text, nullable | required before `CLOSED` (FR-052) |
| reworkBookingId | UUID, nullable, FK → Booking | |
| resolvedAt | datetime, nullable | |

## 19. Review

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| bookingId | UUID, FK → Booking, unique | one review per booking |
| customerId | UUID, FK → CustomerProfile | |
| rating | int, 1–5 | FR-050 |
| comment | text, nullable | |
| submittedAt | datetime | |
| followUpRequired | boolean | auto-set true when rating ≤ 2 (FR-054) |

## 20. Subscription

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| customerId | UUID, FK → CustomerProfile | |
| addressId | UUID, FK → CustomerAddress | |
| serviceConfigurationJson | jsonb | service + add-ons |
| frequency | enum `WEEKLY` \| `BIWEEKLY` \| `MONTHLY` \| `CUSTOM` | |
| preferredWeekday | int, nullable | |
| preferredTimeWindow | string, nullable | |
| priceSnapshot | int (minor units) | |
| startsAt / endsAt | date | |
| status | enum `ACTIVE` \| `PAUSED` \| `CANCELLED` | |
| nextGenerationAt | datetime | job cursor |

**Generation rule**: background job generates `Booking` rows up to an 8-week rolling horizon (FR-056), keyed by `(subscriptionId, occurrenceDate)` unique constraint to guarantee idempotency under retries.

## 21. CommercialAccount / CommercialLocation / Contract

| Entity | Key Fields |
|---|---|
| CommercialAccount | id, companyName, billingContactName, billingContactPhone, billingContactEmail, notes |
| CommercialLocation | id, commercialAccountId (FK), addressId (FK), label |
| Contract | id, commercialAccountId (FK), startDate, endDate, pricingTermsJson, documentReference, status (`ACTIVE`\|`EXPIRED`\|`TERMINATED`) |

## 22. Payment

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| bookingId | UUID, FK → Booking | |
| method | enum `CASH` \| `BANK_TRANSFER` \| `POS` \| `COMPLIMENTARY` \| `OTHER` | |
| status | enum `UNPAID` \| `PARTIALLY_PAID` \| `PAID` \| `REFUNDED_RECORDED` \| `WAIVED` | |
| amount | int (minor units) | |
| reference | string, nullable | |
| paidAt | datetime, nullable | |
| recordedByUserId | UUID, FK → User (Admin) | |

## 23. Invoice

Non-fiscal internal receipt (FR-064 — explicitly not ZATCA e-invoicing).

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| bookingId | UUID, FK → Booking | |
| invoiceNumber | string, unique | |
| issuedAt | datetime | |
| subtotal / discount / travelFee / tax / total | int (minor units) | mirrors Booking snapshot |
| notes | text, nullable | |
| pdfUrl | string, nullable | generated receipt document |

## 24. NotificationTemplate / NotificationLog

| Entity | Key Fields |
|---|---|
| NotificationTemplate | id, key (enum: QUOTE_READY, BOOKING_CONFIRMED, REMINDER, EN_ROUTE, COMPLETED, FEEDBACK_REQUEST, RESCHEDULE, CANCELLATION, REWORK_SCHEDULED), channel (`WHATSAPP`\|`SMS`\|`EMAIL`), bodyAr, bodyEn, active |
| NotificationLog | id, bookingId (FK, nullable), customerId (FK, nullable), channel, templateKey, recipient, payloadSnapshot (jsonb), status (`SENT`\|`FAILED`\|`PENDING`), failureReason (nullable), createdAt |

## 25. WebsiteContentBlock / FaqItem

| Entity | Key Fields |
|---|---|
| WebsiteContentBlock | id, key (unique), type (`PAGE`\|`SECTION`), titleAr, titleEn, bodyAr, bodyEn, sortOrder, active |
| FaqItem | id, questionAr, questionEn, answerAr, answerEn, sortOrder, active |

## 26. SystemSetting

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| key | string, unique | e.g. `default_locale`, `tax_rate`, `booking_horizon_weeks` |
| value | jsonb | |
| description | string | |
| updatedByUserId | UUID, FK → User | |
| updatedAt | datetime | |

## 27. AuditLog

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| actorUserId | UUID, FK → User | |
| action | string | e.g. `PRICE_OVERRIDE`, `BOOKING_CANCELLED`, `PAYMENT_RECORDED`, `EXPORT_GENERATED` |
| entityType / entityId | string / UUID | |
| beforeSnapshotJson / afterSnapshotJson | jsonb, nullable | never includes full phone/address per FR-078 |
| ipAddress / userAgent | string, nullable | |
| createdAt | datetime | |

## 28. RefreshToken / PasswordResetToken

| Entity | Key Fields |
|---|---|
| RefreshToken | id, userId (FK), tokenHash, expiresAt, revokedAt (nullable), replacedByTokenId (nullable, self-FK) |
| PasswordResetToken | id, userId (FK), tokenHash, expiresAt, usedAt (nullable) |

---

## Data Retention (FR-081 / Clarifications)

No automatic deletion or anonymization job runs against any entity above. Historical `Booking`, `CustomerProfile`, `Payment`, and `AuditLog` rows are retained indefinitely by default; only explicit, manually-triggered Admin actions (e.g., a legally-required deletion request) remove data, and that action itself is captured in `AuditLog`.

## PII Classification (for logging/export rules, FR-078, FR-074)

- **Never logged in general application logs**: `User.phoneNormalized`, `CustomerAddress.*` (street/building/unit/landmark/lat/long), `CustomerProfile.internalNotes`.
- **Excluded from exports by default**: same fields as above, unless the specific report's purpose requires them and the export is itself audit-logged (FR-004, FR-073, FR-074).
