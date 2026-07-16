import { test, expect } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";

// Implements US10 (Customer requests a reschedule; Admin approves/rejects).
// Requires both apps running + a live PostgreSQL database with a seeded
// Admin account, an active service, and a service area. Booking setup
// mirrors scheduling-and-capacity.spec.ts's API-driven approach; only the
// reschedule-request submission (Customer) and decision (Admin) go through
// the UI, since that's the behavior under test.
const BASE = "http://localhost:4000/api/v1";

async function adminHeaders(request: APIRequestContext) {
  const res = await request.post(`${BASE}/auth/login`, {
    data: { identifier: "admin@nuqaa-asir.local", password: "ChangeMe123!" },
  });
  const { accessToken } = await res.json();
  return { Authorization: `Bearer ${accessToken}` };
}

async function createScheduledBooking(
  request: APIRequestContext,
  admin: Record<string, string>
): Promise<{ bookingId: string; phone: string; password: string; originalSlotId: string }> {
  const phone = `05${Math.floor(10000000 + Math.random() * 89999999)}`;
  const password = "correct-horse-battery";
  const registerRes = await request.post(`${BASE}/auth/register`, {
    data: { fullName: "Reschedule Test Customer", phone, password },
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
    headers: { ...authHeaders, "Idempotency-Key": `reschedule-test-${Date.now()}-${Math.random()}` },
    data: {
      quoteId: quote.id,
      addressId: address.id,
      propertyType: "VILLA",
      preferredDate: new Date(Date.now() + 86400000).toISOString(),
      contactName: "Reschedule Test Customer",
      contactPhone: phone,
      consentAccepted: true,
    },
  });
  const booking = await bookingRes.json();
  await request.post(`${BASE}/bookings/${booking.id}/confirm`, { headers: admin, data: {} });

  const originalSlotRes = await request.post(`${BASE}/time-slots`, {
    headers: admin,
    data: { date: new Date(Date.now() + 172800000).toISOString(), startTime: "09:00", endTime: "11:00", capacity: 5 },
  });
  const originalSlot = await originalSlotRes.json();
  await request.post(`${BASE}/bookings/${booking.id}/schedule`, {
    headers: admin,
    data: { timeSlotId: originalSlot.id },
  });

  // A second slot for the reschedule target, within the availability
  // window the Customer's RescheduleDialog queries.
  await request.post(`${BASE}/time-slots`, {
    headers: admin,
    data: { date: new Date(Date.now() + 259200000).toISOString(), startTime: "13:00", endTime: "15:00", capacity: 5 },
  });

  return { bookingId: booking.id as string, phone, password, originalSlotId: originalSlot.id as string };
}

test.describe("Customer requests a reschedule, Admin decides (User Story 10)", () => {
  test("submit -> Admin approve updates the booking's schedule", async ({ page, request }) => {
    const admin = await adminHeaders(request);
    const { bookingId, phone, password, originalSlotId } = await createScheduledBooking(request, admin);

    await page.goto("/login");
    await page.getByLabel(/رقم الجوال أو البريد|Mobile number or email/).fill(phone);
    await page.getByLabel(/كلمة المرور|Password/).fill(password);
    await page.getByRole("button", { name: /إرسال|Submit/ }).click();
    await page.waitForURL(/\/bookings/);

    await page.goto(`/bookings/${bookingId}`);
    await page.getByRole("button", { name: /Request Reschedule|طلب إعادة جدولة/ }).click();
    await page.getByLabel(/New Time Slot|الموعد الجديد/).click();
    await page.locator(".ant-select-item-option:not(.ant-select-item-option-disabled)").first().click();
    await page.getByLabel(/Reason \(optional\)|السبب \(اختياري\)/).fill("Schedule conflict");

    const submitResponse = page.waitForResponse(
      (res) => res.url().includes("/reschedule-requests") && res.request().method() === "POST"
    );
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /Submit Request|إرسال الطلب/ })
      .click();
    const submitRes = await submitResponse;
    expect(submitRes.status()).toBe(201);

    await page.goto("/admin/login");
    await page.getByLabel(/رقم الجوال أو البريد|Mobile number or email/).fill("admin@nuqaa-asir.local");
    await page.getByLabel(/كلمة المرور|Password/).fill("ChangeMe123!");
    await page.getByRole("button", { name: /إرسال|Submit/ }).click();
    await page.waitForURL(/\/admin$/);

    await page.goto("/admin/reschedule-requests");
    const row = page.locator("tr", { hasText: /Reschedule Test Customer/ }).first();
    await expect(row).toBeVisible();

    const approveResponse = page.waitForResponse(
      (res) => res.url().includes("/approve") && res.request().method() === "POST"
    );
    await row.getByRole("button", { name: /Approve|قبول/ }).click();
    await page.locator(".ant-popconfirm-buttons button").last().click();
    const approveRes = await approveResponse;
    expect(approveRes.status()).toBe(200);

    // rescheduleBooking() (reused on approval) transitions through
    // RESCHEDULED internally but lands back on CONFIRMED with the new slot
    // — see apps/api/src/modules/bookings/service.ts's rescheduleBooking().
    const updatedBooking = await (
      await request.get(`${BASE}/bookings/${bookingId}`, { headers: admin })
    ).json();
    expect(updatedBooking.status).toBe("CONFIRMED");
    expect(updatedBooking.scheduledTimeSlotId).not.toBe(originalSlotId);
  });

  test("submit -> Admin reject leaves the booking's schedule untouched", async ({ page, request }) => {
    const admin = await adminHeaders(request);
    const { bookingId, phone, password } = await createScheduledBooking(request, admin);
    const before = await (await request.get(`${BASE}/bookings/${bookingId}`, { headers: admin })).json();

    await page.goto("/login");
    await page.getByLabel(/رقم الجوال أو البريد|Mobile number or email/).fill(phone);
    await page.getByLabel(/كلمة المرور|Password/).fill(password);
    await page.getByRole("button", { name: /إرسال|Submit/ }).click();
    await page.waitForURL(/\/bookings/);

    await page.goto(`/bookings/${bookingId}`);
    await page.getByRole("button", { name: /Request Reschedule|طلب إعادة جدولة/ }).click();
    await page.getByLabel(/New Time Slot|الموعد الجديد/).click();
    await page.locator(".ant-select-item-option:not(.ant-select-item-option-disabled)").first().click();

    const submitResponse = page.waitForResponse(
      (res) => res.url().includes("/reschedule-requests") && res.request().method() === "POST"
    );
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /Submit Request|إرسال الطلب/ })
      .click();
    await submitResponse;

    await page.goto("/admin/login");
    await page.getByLabel(/رقم الجوال أو البريد|Mobile number or email/).fill("admin@nuqaa-asir.local");
    await page.getByLabel(/كلمة المرور|Password/).fill("ChangeMe123!");
    await page.getByRole("button", { name: /إرسال|Submit/ }).click();
    await page.waitForURL(/\/admin$/);

    await page.goto("/admin/reschedule-requests");
    const row = page.locator("tr", { hasText: /Reschedule Test Customer/ }).first();
    await row.getByRole("button", { name: /Reject|رفض/ }).click();
    await page.getByLabel(/^(Reason|السبب)$/).fill("Slot not actually available");

    const rejectResponse = page.waitForResponse(
      (res) => res.url().includes("/reject") && res.request().method() === "POST"
    );
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /Reject|رفض/ })
      .click();
    const rejectRes = await rejectResponse;
    expect(rejectRes.status()).toBe(200);

    const after = await (await request.get(`${BASE}/bookings/${bookingId}`, { headers: admin })).json();
    expect(after.scheduledTimeSlotId).toBe(before.scheduledTimeSlotId);
    expect(after.status).toBe("CONFIRMED");
  });
});
