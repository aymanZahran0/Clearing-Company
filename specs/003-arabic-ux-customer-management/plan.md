# Implementation Plan: Arabic UX and Customer Account Management

**Branch**: `003-arabic-ux-customer-management` | **Date**: 2026-07-17 | **Spec**: [spec.md](./spec.md)

## Summary

Build a focused third SpecKit feature on top of the completed platform and production-readiness work. The feature upgrades the existing content-driven home page into a professional Arabic landing experience, introduces custom router-level 404/application-error handling, completes semantic localization of runtime enum values and booking steps, verifies every Customer/Admin screen in Arabic, and adds Customer account suspend/reactivate management to the Admin Dashboard.

This phase reuses the existing React/Vite/Ant Design/i18next frontend, Express/Prisma API, `User.status`, `RefreshToken`, `AuditLog`, customer endpoints, content blocks, FAQs, service catalog, and two-role CUSTOMER/ADMIN model. No new role, deployable, table, or architectural subsystem is required.

## Technical Context

**Language/Version**: TypeScript 5.6+, Node.js 22 LTS  
**Frontend**: React 18, Vite 5, React Router 6, Redux Toolkit/RTK Query, Ant Design, Tailwind, react-i18next  
**Backend**: Express 4, Prisma 5, PostgreSQL 16+, Zod, JWT/refresh tokens  
**Testing**: Vitest + RTL, Vitest + Supertest, Playwright + axe  
**Project structure**: Existing npm-workspaces monorepo (`apps/web`, `apps/api`, `packages/shared`)

## Design Decisions

### D1 — Keep bilingual architecture; make Arabic complete and default

Do not remove English resources because the current architecture and constitution are bilingual. Arabic becomes the verified default, and Arabic mode must never expose English literals or raw enum codes.

### D2 — Centralized enum presentation layer

Create locale-aware option/label helpers instead of translating values ad hoc inside each page. API payloads continue using stable enum codes. UI components consume `{ value, label }` options derived from translation keys.

Recommended files:

```text
apps/web/src/lib/enumLabels.ts
apps/web/src/lib/enumOptions.ts
apps/web/src/locales/ar/enums.json
apps/web/src/locales/en/enums.json
```

Register an `enums` i18n namespace. Cover at minimum:

- PropertyType
- BookingStatus
- PricingType
- PaymentMethod
- PaymentStatus
- NotificationChannel
- UserStatus
- ChecklistItemType
- QualityIssueStatus/category/severity
- Subscription/occurrence statuses
- Any enum found by repository audit

### D3 — Structured professional home using existing APIs

Retain `WebsiteContentBlock` and existing public content/service/FAQ APIs. `Home.tsx` becomes a composed page with reusable sections rather than a plain loop of headings and paragraphs.

Recommended components:

```text
apps/web/src/customer/components/home/HeroSection.tsx
apps/web/src/customer/components/home/ServicesSection.tsx
apps/web/src/customer/components/home/HowItWorksSection.tsx
apps/web/src/customer/components/home/WhyChooseUsSection.tsx
apps/web/src/customer/components/home/ServiceAreasSection.tsx
apps/web/src/customer/components/home/TrustSection.tsx
apps/web/src/customer/components/home/FaqPreviewSection.tsx
apps/web/src/customer/components/home/ContactCtaSection.tsx
apps/web/src/customer/components/home/PublicFooter.tsx
```

Use known content-block keys (`home-hero`, `home-why-us`, etc.) when present and provide polished Arabic fallback copy for required structural sections. Do not hardcode fabricated customer counts, ratings, or completion statistics.

### D4 — Route-level recovery

Add both:

1. A wildcard `*` route rendering `NotFoundPage`.
2. A root-level React Router `errorElement` rendering `RouteErrorPage`.

Confirm canonical auth routes exist and add redirects only when legacy paths are already in use.

Recommended files:

```text
apps/web/src/pages/NotFoundPage.tsx
apps/web/src/pages/RouteErrorPage.tsx
apps/web/src/app/router.tsx
```

### D5 — Customer status lifecycle uses existing User.status

No database migration is expected. Add customer-specific status endpoints inside the existing customers module, distinct from the Admin-account lifecycle module.

Recommended API:

```http
GET  /api/v1/customers?search=&status=&page=&limit=
GET  /api/v1/customers/:id
POST /api/v1/customers/:id/suspend
POST /api/v1/customers/:id/reactivate
```

Suspend body:

```json
{ "reason": "Required Arabic or English operational reason" }
```

The suspend transaction must:

1. Verify target role is CUSTOMER.
2. Verify current status allows the transition.
3. Update `User.status` to `SUSPENDED`.
4. Revoke/delete all target refresh tokens.
5. Write an AuditLog entry with before/after status and reason.

Authentication and refresh services must check status and return `ACCOUNT_SUSPENDED` without exposing sensitive detail.

**Clarified 2026-07-17**: suspend/reactivate on a target already in the requested state is not a no-op — it is rejected `409 Conflict` with a stable error code (`CUSTOMER_ALREADY_SUSPENDED` from suspend, `CUSTOMER_NOT_SUSPENDED` from reactivate) and writes no AuditLog row. Only an actual status change is audited.

### D6 — Customer history is preserved

Suspension only controls authentication/authorization. Existing bookings, invoices, addresses, reviews, complaints, and related reports remain untouched and visible to Admin according to existing permissions.

### D7 — Public statistics aggregate endpoint

**Clarified 2026-07-17**: the professional home page's trust/quality section needs real numbers, but no stats model or endpoint exists — `WebsiteContentBlock` is plain title/body text only. Add a new unauthenticated endpoint rather than fabricating numbers or expanding `WebsiteContentBlock`'s schema.

```http
GET /api/v1/public/stats
```

```json
{
  "completedBookingsCount": 1240,
  "averageRating": 4.8
}
```

- `completedBookingsCount`: `COUNT(*)` of `Booking` rows with `status = COMPLETED`. Field is omitted from the response entirely when the count is `0` (FR-007a: not shown as a zero/placeholder).
- `averageRating`: `AVG(rating)` over `Review`, rounded to 1 decimal. Field is omitted when there are zero reviews.
- No auth required; cacheable (short TTL) since values change infrequently relative to traffic.

Recommended files:

```text
apps/api/src/modules/public-stats/
├── service.ts
├── controller.ts
└── routes.ts
apps/web/src/customer/components/home/TrustSection.tsx (consumes the endpoint)
apps/web/src/api/publicStatsApi.ts
```

## Project Changes

```text
apps/web/src/
├── app/router.tsx
├── pages/
│   ├── NotFoundPage.tsx
│   └── RouteErrorPage.tsx
├── lib/
│   ├── enumLabels.ts
│   └── enumOptions.ts
├── locales/
│   ├── ar/{common,customer,admin,catalog,content,enums}.json
│   └── en/{common,customer,admin,catalog,content,enums}.json
├── customer/
│   ├── pages/Home.tsx
│   ├── pages/BookingWizard/index.tsx
│   └── components/home/*.tsx
├── admin/pages/customers/
│   ├── List.tsx
│   ├── Detail.tsx
│   ├── SuspendCustomerDialog.tsx
│   └── ReactivateCustomerDialog.tsx
└── api/customersApi.ts

apps/api/src/
├── modules/customers/
│   ├── schema.ts
│   ├── service.ts
│   ├── controller.ts
│   └── routes.ts
├── modules/public-stats/
│   ├── service.ts
│   ├── controller.ts
│   └── routes.ts
├── modules/auth/service.ts
└── middleware/authenticate.ts

apps/api/tests/integration/
├── customerAccountStatus.test.ts
└── publicStats.test.ts

apps/web/tests/unit/
├── enumLabels.test.ts
├── NotFoundPage.test.tsx
└── BookingWizardArabic.test.tsx

tests/e2e/
├── arabic-ui-audit.spec.ts
├── not-found-and-errors.spec.ts
├── professional-home.spec.ts
└── customer-account-management.spec.ts
```

## Constitution Check

| Principle | Result | Notes |
|---|---|---|
| Production-grade code | PASS | Zod validation, transactional audit/revocation, tests for every status transition |
| Mobile-first | PASS | Home, wizard, errors, and customer management verified at 360px |
| Bilingual/RTL | PASS | Completes semantic localization while preserving English support |
| Accessibility | PASS | Keyboard/axe checks for new pages and dialogs |
| Performance/SEO | PASS | Home reuses current APIs and remains compatible with existing prerender work |
| Technology constraints | PASS | No new role, service, framework, or database |

## Validation Strategy

1. Run locale-key audit and TypeScript checks.
2. Unit-test enum mappings and fallback behavior.
3. Integration-test suspend/reactivate, token invalidation, audit logs, permissions, and history preservation.
4. E2E-test the entire booking wizard in Arabic at 360px.
5. E2E-crawl all registered routes in Arabic and detect raw enum codes/known English labels.
6. E2E-test unknown routes and forced route errors.
7. E2E-test Admin customer list → suspend → blocked customer access → reactivate → successful login.
8. Run accessibility checks and visual overflow checks.
9. Integration-test `GET /api/v1/public/stats` field omission (zero completed bookings / zero reviews) and p95 < 500ms for `GET /api/v1/customers` (SC-007).

## Risks and Mitigations

- **Risk**: Literal-string ESLint cannot detect enum codes returned at runtime.  
  **Mitigation**: Central enum maps plus E2E runtime audit.

- **Risk**: Suspended access tokens remain valid until expiry.  
  **Mitigation**: `authenticate` or authorization middleware verifies current user status for protected requests; refresh tokens are revoked immediately.

- **Risk**: Home content blocks are too generic for complex layouts.  
  **Mitigation**: Map known keys to structured components and gracefully render unknown active blocks in a generic section.

- **Risk**: Horizontal Ant Design Steps clip in RTL/mobile.  
  **Mitigation**: Responsive direction/compact progress with explicit Arabic titles and E2E 360px overflow assertions.
