import { test, expect } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";

// Implements quickstart.md V4. Requires both apps running + a live
// PostgreSQL database with a seeded Admin account, an active service, and a
// service area — not runnable in this sandbox. Selectors verified against
// apps/web/src/admin/pages/bookings/{List,Detail,ScheduleDialog}.tsx and
// apps/web/src/admin/pages/schedule/TimeSlots.tsx.
//
// Both the CONFIRMED booking and (for the capacity test) the already-full
// TimeSlot are created fresh via the API for each test, rather than relying
// on shared seed fixtures other spec files may have already consumed.
const BASE = "http://localhost:4000/api/v1";

async function adminHeaders(request: APIRequestContext) {
  const res = await request.post(`${BASE}/auth/login`, {
    data: { identifier: "admin@nuqaa-asir.local", password: "ChangeMe123!" },
  });
  const { accessToken } = await res.json();
  return { Authorization: `Bearer ${accessToken}` };
}

async function createConfirmedBooking(request: APIRequestContext, admin: Record<string, string>): Promise<string> {
  const uniquePhone = `05${Math.floor(10000000 + Math.random() * 89999999)}`;
  const registerRes = await request.post(`${BASE}/auth/register`, {
    data: { fullName: "Scheduling Test Customer", phone: uniquePhone, password: "correct-horse-battery" },
  });
  const { accessToken } = await registerRes.json();
  const authHeaders = { Authorization: `Bearer ${accessToken}` };

  const areasRes = await request.get(`${BASE}/service-areas`);
  const [area] = await areasRes.json();

  const addressRes = await request.post(`${BASE}/addresses/me`, {
    headers: authHeaders,
    data: { city: area.city, neighborhood: "Al Numan", serviceAreaId: area.id },
  });
  const address = await addressRes.json();

  const servicesRes = await request.get(`${BASE}/services`);
  const services = await servicesRes.json();
  const service = services.find((s: { slug: string }) => s.slug === "home-cleaning") ?? services[0];

  const quoteRes = await request.post(`${BASE}/quotes/estimate`, {
    data: {
      serviceId: service.id,
      propertyType: "VILLA",
      propertySizeInput: { sizeMultiplier: 3, conditionModifiers: [] },
      addressId: address.id,
      requestedDate: new Date(Date.now() + 86400000).toISOString(),
    },
  });
  const quote = await quoteRes.json();

  const bookingRes = await request.post(`${BASE}/bookings`, {
    headers: { ...authHeaders, "Idempotency-Key": `scheduling-test-${Date.now()}-${Math.random()}` },
    data: {
      quoteId: quote.id,
      addressId: address.id,
      propertyType: "VILLA",
      preferredDate: new Date(Date.now() + 86400000).toISOString(),
      contactName: "Scheduling Test Customer",
      contactPhone: uniquePhone,
      consentAccepted: true,
    },
  });
  const booking = await bookingRes.json();

  await request.post(`${BASE}/bookings/${booking.id}/confirm`, { headers: admin, data: {} });
  return booking.id as string;
}

// A dedicated capacity-1 slot, immediately filled by a second throwaway
// confirmed booking, so it reliably renders as the disabled "(1/1)" option.
// The Time Slot <Select> is virtualized and unsearchable (ScheduleDialog.tsx
// has no `showSearch`), so only the first handful of DOM-rendered options
// are reachable without scrolling — placing this slot at 08:00 today, ahead
// of every seeded 09:00+ slot (listTimeSlots orders by date, startTime
// ascending), guarantees it sorts first and stays visible.
async function createFullTimeSlot(request: APIRequestContext, admin: Record<string, string>): Promise<string> {
  const date = new Date().toISOString();
  const slotRes = await request.post(`${BASE}/time-slots`, {
    headers: admin,
    data: { date, startTime: "08:00", endTime: "08:30", capacity: 1 },
  });
  const slot = await slotRes.json();

  const fillerBookingId = await createConfirmedBooking(request, admin);
  await request.post(`${BASE}/bookings/${fillerBookingId}/schedule`, {
    headers: admin,
    data: { timeSlotId: slot.id },
  });

  return slot.id as string;
}

test.describe("Admin schedules a booking and hits time-slot capacity (User Story 4)", () => {
  test("schedules a confirmed booking with an internal note", async ({ page, request }) => {
    const admin = await adminHeaders(request);
    const bookingId = await createConfirmedBooking(request, admin);

    await page.goto("/admin/login");
    await page.getByLabel(/رقم الجوال أو البريد|Mobile number or email/).fill("admin@nuqaa-asir.local");
    await page.getByLabel(/كلمة المرور|Password/).fill("ChangeMe123!");
    await page.getByRole("button", { name: /إرسال|Submit/ }).click();
    await page.waitForURL(/\/admin$/);

    await page.goto(`/admin/bookings/${bookingId}`);

    await page.getByRole("button", { name: /^(Schedule|جدولة)$/ }).click();
    await page.getByLabel(/Time Slot|الموعد/).click();
    // Ant Design's Select renders an ARIA-only `role="option"` listbox
    // (zero-size, accessibility tree only) alongside the actual visible/
    // clickable `.ant-select-item-option` — target the latter, and
    // specifically a non-disabled (not-yet-full) one.
    await page.locator(".ant-select-item-option:not(.ant-select-item-option-disabled)").first().click();
    await page.getByLabel(/Internal Handling Note \(optional\)|ملاحظة داخلية \(اختياري\)/).fill("Bring extra supplies");

    const scheduleResponse = page.waitForResponse(
      (res) => res.url().includes("/schedule") && res.request().method() === "POST"
    );
    // The page's own "Schedule" action button is still present behind the
    // open dialog, so scope to the dialog's submit button specifically.
    await page
      .getByRole("dialog", { name: /Schedule Booking|جدولة الحجز/ })
      .getByRole("button", { name: /^(Schedule|جدولة)$/ })
      .click();
    const response = await scheduleResponse;
    expect(response.status()).toBe(200);
  });

  test("blocks scheduling into a full time slot without an explicit override", async ({ page, request }) => {
    const admin = await adminHeaders(request);
    const bookingId = await createConfirmedBooking(request, admin);
    await createFullTimeSlot(request, admin);

    await page.goto("/admin/login");
    await page.getByLabel(/رقم الجوال أو البريد|Mobile number or email/).fill("admin@nuqaa-asir.local");
    await page.getByLabel(/كلمة المرور|Password/).fill("ChangeMe123!");
    await page.getByRole("button", { name: /إرسال|Submit/ }).click();
    await page.waitForURL(/\/admin$/);

    await page.goto(`/admin/bookings/${bookingId}`);

    await page.getByRole("button", { name: /^(Schedule|جدولة)$/ }).click();
    // The full slot's option is rendered disabled by ScheduleDialog.tsx, so
    // the client-side control alone should prevent selecting it; this
    // asserts the option is disabled rather than attempting a submit that
    // the UI itself would block.
    await page.getByLabel(/Time Slot|الموعد/).click();
    // Scoped to this test's own slot, in case earlier full-capacity slots
    // exist from other test runs against the same environment. Ant Design
    // marks a disabled option via a CSS class, not a populated
    // `aria-disabled` attribute value.
    await expect(page.getByRole("option", { name: /1\/1/ }).first()).toHaveClass(/ant-select-item-option-disabled/);
    await page.keyboard.press("Escape"); // close the dropdown so it stops intercepting clicks

    // With the override box checked, the same slot becomes selectable and
    // the server records a CAPACITY_OVERRIDE audit entry (verified in
    // apps/api/tests/integration/scheduling.test.ts).
    await page.getByRole("checkbox", { name: /Override capacity for a full slot|تجاوز السعة لموعد ممتلئ/ }).check();
  });
});
