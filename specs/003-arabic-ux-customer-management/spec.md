# Feature Specification: Arabic UX, Professional Home, Error Handling, and Customer Account Control

**Feature Branch**: `003-arabic-ux-customer-management`  
**Created**: 2026-07-17  
**Status**: Draft  
**Depends on**: `001-cleaning-company-platform`, `002-production-readiness`

## Summary

Enhance the existing Nuqaa Asir platform with a professional, content-rich public home page; complete Arabic localization for the Customer Portal and Admin Dashboard; correct RTL behavior in the booking wizard; Arabic labels for all enum-backed dropdowns and statuses; custom Not Found and application error pages; and an Admin customer-management section that can list, search, inspect, suspend, and reactivate Customer accounts.

The existing bilingual architecture remains in place, but Arabic is the default locale and every visible value in Arabic mode must be Arabic. Internal enum values and API payloads remain stable English codes.

## Clarifications

### Session 2026-07-17

- Q: When Admin attempts an invalid/no-op customer status transition (suspend an already-suspended Customer, or reactivate a Customer who isn't suspended), what should the API do? → A: Reject with 409 Conflict (e.g. `CUSTOMER_ALREADY_SUSPENDED` / `CUSTOMER_NOT_SUSPENDED`) and write no AuditLog entry — only real transitions are audited.
- Q: No stats/aggregate model or endpoint currently exists (only `WebsiteContentBlock` plain text). How should the home page source its real-data statistics (e.g. completed bookings, average rating)? → A: Add a new public backend aggregate endpoint (e.g. `GET /api/v1/public/stats`) that computes real numbers from existing tables; this expands the feature's backend scope beyond a pure front-end/localization change.
- Q: The spec references an "existing Admin list performance target" for the Customer list, but no numeric target for Admin list pages is defined anywhere else in this repo. What should the measurable target be? → A: p95 < 500ms API response time for `GET /api/v1/customers` (paginated, default page size) in the integration test environment.

## Scope

### In scope

1. Redesign and expand the public home page.
2. Add custom 404 and route-level application error handling.
3. Complete Arabic localization across all customer and admin routes.
4. Localize booking wizard step titles and fix RTL/mobile layout.
5. Localize all enum-backed dropdown options, badges, statuses, table filters, validation errors, empty states, and notifications.
6. Add Admin customer-account management with suspend/reactivate actions.
7. Add automated tests for Arabic rendering, route errors, and customer status lifecycle.
8. Add a new public statistics aggregate endpoint (e.g. completed-bookings count, average rating) to back real home-page trust indicators.

### Out of scope

- New roles or permission systems.
- Deleting Customer accounts or historical bookings.
- Replacing React/Vite, Express, Prisma, PostgreSQL, Ant Design, Redux Toolkit, or i18next.
- Removing English support.
- Rebuilding existing catalog, booking, content, or Admin-account modules.
- Introducing a new CMS or page-builder framework.

## User Stories

### US1 — Visitor sees a professional home page (P1)

As a visitor, I want a clear and professional Arabic home page so I can understand the service, trust the company, browse services, and start a booking quickly.

**Acceptance scenarios**

1. The page displays a full-width hero with Arabic title, description, primary booking CTA, secondary services CTA, and a relevant visual area.
2. The page displays active services from the existing services API.
3. The page displays sections for how booking works, why choose us, service areas, trust/quality indicators, FAQ preview, contact/WhatsApp CTA, and a complete footer.
4. Admin-managed `WebsiteContentBlock` data is used for editable text where available.
5. Missing optional content does not leave broken or empty visual sections.
6. The home page is responsive at 360px and larger and does not horizontally overflow.
7. No fake statistics are hardcoded. Statistics (e.g. completed bookings, average rating) are fetched from a new public aggregate endpoint that computes real numbers from existing tables; a stat is hidden entirely rather than shown as zero/placeholder when the underlying count is not yet meaningful (e.g. no completed bookings).

### US2 — User receives a useful 404/error experience (P1)

As a user, I want friendly Arabic error pages so I can recover instead of seeing React Router's default developer error.

**Acceptance scenarios**

1. Visiting an unknown route displays a branded Arabic 404 page.
2. `/login`, `/register`, `/forgot-password`, `/reset-password`, and `/admin/login` resolve to their intended pages.
3. The 404 page provides actions to return home and go back.
4. Route rendering errors display a branded Arabic application error page with retry and home actions.
5. Stack traces and internal error details are never shown in production.
6. Unauthorized and forbidden states continue using the correct authentication/authorization behavior and are not misreported as 404.

### US3 — Customer completes the booking flow fully in Arabic (P1)

As an Arabic-speaking customer, I want every booking step and option in Arabic so I can complete a booking without English labels or raw enum codes.

**Acceptance scenarios**

1. Booking step titles display Arabic labels in correct RTL order:
   - العقار
   - العنوان
   - الإضافات
   - الموعد
   - عرض السعر
   - التأكيد
2. The active, completed, and pending step states remain visually clear in RTL.
3. On small screens, steps use a compact or vertical layout without clipping.
4. Property type values display Arabic labels while the submitted API values remain unchanged:
   - `APARTMENT` → شقة
   - `VILLA` → فيلا
   - `OFFICE` → مكتب
   - `SHOP` → متجر
   - `CLINIC` → عيادة
   - `FURNISHED_UNIT` → وحدة مفروشة
   - `OTHER` → أخرى
5. All other enum-backed fields follow the same code-to-label pattern.
6. Form validation messages, loading states, errors, buttons, placeholders, date/currency output, and empty states are Arabic in Arabic mode.

### US4 — Admin Dashboard is fully usable in Arabic (P1)

As an Admin, I want the entire dashboard rendered in Arabic with correct RTL behavior so I can operate the business without mixed-language screens.

**Acceptance scenarios**

1. All navigation labels, page titles, breadcrumbs, buttons, modal titles, table columns, filters, dropdown options, badges, notifications, and confirmation messages display Arabic in Arabic mode.
2. No raw backend enum code is rendered directly to the user.
3. Tables and forms remain readable and correctly aligned in RTL.
4. Arabic is the default locale after a fresh visit.
5. Existing English translations remain available and switching locale does not corrupt layout.
6. A runtime localization audit test visits all registered customer/admin routes and fails when raw enum codes or known English-only labels appear in Arabic mode.

### US5 — Admin manages Customer account status (P1)

As an Admin, I want to list and suspend/reactivate Customer users so I can control access without deleting business history.

**Acceptance scenarios**

1. Admin can open a new dashboard section: `إدارة العملاء`.
2. The list is paginated and searchable by name, normalized phone, and email where present.
3. The list can be filtered by status: active, invited, suspended.
4. Each row shows name, phone, email, account status, created date, last login where available, bookings count, and actions.
5. Admin can open Customer details and view profile summary, addresses, and recent bookings through existing authorized endpoints or links.
6. Suspending a Customer requires confirmation and a reason.
7. Suspending a Customer revokes active refresh tokens and prevents new login, token refresh, and authenticated Customer API access.
8. Suspending a Customer does not delete or modify bookings, invoices, reviews, complaints, or audit history.
9. Admin can reactivate a suspended Customer.
10. Every successful suspend/reactivate action writes an AuditLog record containing actor, target user, previous status, new status, reason, and timestamp.
11. Attempting to suspend an already-suspended Customer, or reactivate a Customer that is not suspended, is rejected with a 409 Conflict and no AuditLog entry is written.
12. Customer-role endpoints cannot suspend/reactivate users.
13. Admin-account management remains separate and unchanged.

## Functional Requirements

- **FR-001**: Arabic MUST be the default locale for a fresh session.
- **FR-002**: The application MUST retain `dir="rtl"` and `lang="ar"` in Arabic mode.
- **FR-003**: Every route MUST have either a matching route or a custom wildcard fallback.
- **FR-004**: The router MUST define a branded `errorElement` or equivalent route error boundary.
- **FR-005**: Production error pages MUST not expose stack traces, database messages, environment values, or request internals.
- **FR-006**: The home page MUST use existing service/content APIs rather than duplicate business content in code where dynamic data exists.
- **FR-007**: Optional home sections MUST hide gracefully when data is unavailable.
- **FR-007a**: A new public, unauthenticated aggregate endpoint MUST provide real, computed home-page statistics (e.g. completed-bookings count, average rating) derived from existing tables. Individual stats MUST be omitted from the response (not shown as zero/placeholder) when not yet meaningful.
- **FR-008**: Translation keys MUST be organized by existing namespaces (`common`, `customer`, `admin`, `catalog`, `content`) or a documented extension.
- **FR-009**: UI code MUST never render enum codes directly. It MUST use centralized locale-aware label maps/helpers.
- **FR-010**: Enum label helpers MUST include a safe Arabic fallback such as `غير معروف`, while logging an actionable development warning for unmapped codes.
- **FR-011**: Booking step configuration MUST use translation keys, not literal English titles.
- **FR-012**: Booking steps MUST render without clipping at 360px in RTL.
- **FR-013**: Customer status mutations MUST be Admin-only and Zod-validated.
- **FR-014**: Customer suspension MUST invalidate all active refresh tokens for the target Customer.
- **FR-015**: Authentication and refresh flows MUST reject suspended accounts with a stable non-sensitive error code such as `ACCOUNT_SUSPENDED`.
- **FR-016**: Existing historical records MUST remain intact after suspension.
- **FR-017**: Customer status transitions MUST be audited transactionally. Only an actual status change (SUSPENDED ↔ ACTIVE/INVITED) is a transition; invalid or no-op transitions MUST NOT write an AuditLog entry.
- **FR-017a**: Attempting to suspend a Customer who is already `SUSPENDED`, or reactivate a Customer who is not `SUSPENDED`, MUST be rejected with an HTTP 409 Conflict and a stable error code (`CUSTOMER_ALREADY_SUSPENDED` / `CUSTOMER_NOT_SUSPENDED`).
- **FR-018**: Customer list endpoints MUST support pagination and status/search filters.
- **FR-019**: Customer list responses MUST not expose password hashes, reset tokens, refresh tokens, or other secrets.
- **FR-020**: New customer-management UI MUST be mobile-responsive and keyboard accessible.

## Non-Functional Requirements

- WCAG 2.1 AA target for all new/changed screens.
- 44×44px minimum interactive targets on mobile.
- No horizontal overflow at 360px.
- Existing API performance targets remain unchanged.
- Customer list first page (`GET /api/v1/customers`, default page size) MUST respond in under 500ms at p95 in the integration test environment.
- No new microservice or database is introduced.

## Success Criteria

- **SC-001**: All registered public, customer, and admin routes show no default React Router error page.
- **SC-002**: Arabic-mode E2E audit finds zero raw enum values and zero known English step labels across the booking flow.
- **SC-003**: Booking wizard completes successfully at a 360px Arabic viewport.
- **SC-004**: Admin can suspend a Customer; the Customer's existing session is rejected on the next protected request/refresh; Admin can reactivate the account.
- **SC-005**: Suspension/reactivation produces complete AuditLog entries and preserves all historical bookings.
- **SC-006**: Home page contains at least six meaningful responsive sections and primary CTAs without using fabricated metrics.
- **SC-007**: `GET /api/v1/customers` (default page size) responds in under 500ms at p95 in the integration test environment.
