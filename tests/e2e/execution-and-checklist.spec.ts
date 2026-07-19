import { test, expect } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";

// Implements quickstart.md V5. Requires both apps running + a live
// PostgreSQL database with a seeded Admin account, an active service with a
// published checklist template (home-cleaning), and a service area — not
// runnable in this sandbox. Selectors verified against
// apps/web/src/admin/pages/bookings/Detail.tsx and ChecklistRunner.tsx.
//
// The booking is created and confirmed via the API (not the shared seed
// fixture) so this test doesn't depend on — or fight over — a specific
// CONFIRMED row left behind by other tests/spec files.
async function createConfirmedBooking(request: APIRequestContext): Promise<string> {
  const uniquePhone = `05${Math.floor(10000000 + Math.random() * 89999999)}`;
  const registerRes = await request.post("http://localhost:4000/api/v1/auth/register", {
    data: { fullName: "Execution Test Customer", phone: uniquePhone, password: "correct-horse-battery" },
  });
  const { accessToken } = await registerRes.json();
  const authHeaders = { Authorization: `Bearer ${accessToken}` };

  const areasRes = await request.get("http://localhost:4000/api/v1/service-areas");
  const [area] = await areasRes.json();

  const addressRes = await request.post("http://localhost:4000/api/v1/addresses/me", {
    headers: authHeaders,
    data: { city: area.city, neighborhood: "Al Numan", serviceAreaId: area.id },
  });
  const address = await addressRes.json();

  const servicesRes = await request.get("http://localhost:4000/api/v1/services");
  const services = await servicesRes.json();
  const service = services.find((s: { slug: string }) => s.slug === "home-cleaning") ?? services[0];

  const quoteRes = await request.post("http://localhost:4000/api/v1/quotes/estimate", {
    data: {
      serviceId: service.id,
      propertyType: "VILLA",
      propertySizeInput: { conditionModifiers: [] },
      addressId: address.id,
      requestedDate: new Date(Date.now() + 86400000).toISOString(),
    },
  });
  const quote = await quoteRes.json();

  const bookingRes = await request.post("http://localhost:4000/api/v1/bookings", {
    headers: { ...authHeaders, "Idempotency-Key": `execution-test-${Date.now()}-${Math.random()}` },
    data: {
      quoteId: quote.id,
      addressId: address.id,
      propertyType: "VILLA",
      preferredDate: new Date(Date.now() + 86400000).toISOString(),
      contactName: "Execution Test Customer",
      contactPhone: uniquePhone,
      consentAccepted: true,
    },
  });
  const booking = await bookingRes.json();

  const adminLoginRes = await request.post("http://localhost:4000/api/v1/auth/login", {
    data: { identifier: "admin@nuqaa-asir.local", password: "ChangeMe123!" },
  });
  const { accessToken: adminToken } = await adminLoginRes.json();

  await request.post(`http://localhost:4000/api/v1/bookings/${booking.id}/confirm`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: {},
  });

  // The "Arrived" action only appears once a booking has a scheduled slot
  // (apps/web/src/admin/pages/bookings/Detail.tsx gates on
  // `status === "CONFIRMED" && scheduledStartAt`), so confirming alone
  // isn't enough to reach the arrival step this test exercises.
  const slotsRes = await request.get("http://localhost:4000/api/v1/time-slots", {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const slots = await slotsRes.json();
  const availableSlot = slots.find((s: { bookedCount: number; capacity: number }) => s.bookedCount < s.capacity);
  await request.post(`http://localhost:4000/api/v1/bookings/${booking.id}/schedule`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: { timeSlotId: availableSlot.id },
  });

  return booking.id as string;
}

test.describe("Admin executes a booking and completes the quality checklist (User Story 5)", () => {
  test("walks arrival through completion, blocked until required items are answered", async ({
    page,
    request,
  }) => {
    const bookingId = await createConfirmedBooking(request);

    await page.goto("/admin/login");
    await page.getByLabel(/رقم الجوال أو البريد|Mobile number or email/).fill("admin@nuqaa-asir.local");
    await page.getByLabel(/كلمة المرور|Password/).fill("ChangeMe123!");
    await page.getByRole("button", { name: /إرسال|Submit/ }).click();
    await page.waitForURL(/\/admin$/);

    await page.goto(`/admin/bookings/${bookingId}`);

    await page.getByRole("button", { name: /^(Arrived|تم الوصول)$/ }).click();
    await expect(page.getByRole("button", { name: /^(Start|بدء)$/ })).toBeEnabled();
    await page.getByRole("button", { name: /^(Start|بدء)$/ }).click();

    await expect(page.getByText(/Quality Checklist|قائمة الجودة/)).toBeVisible();

    // Completing before any required item is answered should surface the
    // server's 409 + outstanding-items error rather than transition status.
    await page.getByRole("button", { name: /Complete Booking|إنهاء الحجز/ }).click();
    await expect(page.getByText(/could not complete|تعذر الإنهاء/i)).toBeVisible();

    // Answer every required item, then complete successfully. Ant Design's
    // Radio.Button renders the actual <input> at zero size and positioned
    // off-screen (the visible, clickable surface is the wrapping <label>),
    // so click the label rather than the (Playwright-invisible) input.
    const yesButtons = page.locator("label.ant-radio-button-wrapper", { hasText: /^(Yes|نعم)$/ });
    const count = await yesButtons.count();
    for (let i = 0; i < count; i++) {
      await yesButtons.nth(i).click();
    }
    // The seeded template's required SIGNATURE item ("Customer sign-off")
    // also gates completion — fill it alongside the YES_NO items.
    await page.getByPlaceholder(/Signed by|توقيع/).fill("Playwright Test");
    await page.getByRole("button", { name: /Save Checklist|حفظ القائمة/ }).click();

    const completeResponse = page.waitForResponse(
      (res) => res.url().includes("/complete") && res.request().method() === "POST"
    );
    await page.getByRole("button", { name: /Complete Booking|إنهاء الحجز/ }).click();
    const response = await completeResponse;
    expect(response.status()).toBe(200);
    // Status is now localized (enumLabel) — "مكتمل" is the Arabic default.
    await expect(page.getByText(/^(COMPLETED|مكتمل)$/)).toBeVisible();
  });
});
