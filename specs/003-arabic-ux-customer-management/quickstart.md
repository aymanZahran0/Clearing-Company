# Quickstart Validation: Phase 003

## V1 — Professional Arabic home

1. Run API and web apps with seeded services/content.
2. Open `/` in Arabic at 360×800 and desktop width.
3. Confirm hero, services, how-it-works, why-us, service areas, trust, FAQ preview, CTA, and footer render.
4. Confirm no horizontal overflow and no fabricated statistic is shown.
5. Deactivate optional content and confirm its section hides gracefully.

## V2 — Route handling

1. Open `/login`, `/register`, `/forgot-password`, `/reset-password`, and `/admin/login`.
2. Confirm each expected page renders.
3. Open `/this-route-does-not-exist`.
4. Confirm branded Arabic 404 with Home and Back actions.
5. Trigger a controlled route-loader/render error in test mode.
6. Confirm branded error UI and no stack trace in production mode.

## V3 — Arabic booking wizard

1. Open a service and start booking in Arabic.
2. Confirm step titles: العقار، العنوان، الإضافات، الموعد، عرض السعر، التأكيد.
3. Confirm step order/progress is correct in RTL and not clipped at 360px.
4. Open property type dropdown and confirm all labels are Arabic.
5. Complete booking and verify API payload still contains enum codes such as `VILLA` rather than translated text.

## V4 — Arabic route audit

1. Visit every public/customer/admin route in Arabic using Playwright.
2. Assert `html[lang="ar"][dir="rtl"]`.
3. Fail on known raw enum patterns and known English-only booking labels.
4. Confirm tables, modals, filters, empty states, toasts, and validation messages are Arabic.

## V5 — Customer suspension lifecycle

1. Admin opens `إدارة العملاء`.
2. Search for an active Customer and open details.
3. Suspend with a reason.
4. Confirm status badge changes to `موقوف` and audit entry exists.
5. Confirm the Customer's refresh token no longer works.
6. Confirm login and protected Customer API access return `ACCOUNT_SUSPENDED`.
7. Confirm historical bookings remain unchanged and visible to Admin.
8. Reactivate Customer.
9. Confirm old refresh token remains invalid, but a new login succeeds.
10. Attempt to suspend the same Customer twice in a row; confirm the second call returns `409 CUSTOMER_ALREADY_SUSPENDED` and no new AuditLog row is written.
11. Attempt to reactivate a Customer who is not suspended; confirm `409 CUSTOMER_NOT_SUSPENDED` and no new AuditLog row is written.

## V6 — Public stats endpoint

1. With zero completed bookings and zero reviews seeded, call `GET /api/v1/public/stats` and confirm the response omits `completedBookingsCount` and `averageRating` (no zero/placeholder values).
2. Seed completed bookings and reviews, call the endpoint again, and confirm both fields appear with correct computed values.
3. Confirm the home page trust section only renders a stat when its field is present in the response.
4. Confirm `GET /api/v1/customers` (default page size) responds in under 500ms at p95 (SC-007).
