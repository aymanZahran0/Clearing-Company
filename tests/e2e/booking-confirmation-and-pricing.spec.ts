import { test, expect } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";

// Implements quickstart.md V3. Requires both apps running + a live
// PostgreSQL database with a seeded Admin account and at least one active
// service/service area — not runnable in this sandbox. Selectors verified
// against apps/web/src/admin/pages/bookings/{List,Detail,ConfirmDialog,RejectDialog}.tsx.
//
// Each test creates its own fresh PENDING booking via the API rather than
// relying on the shared seed fixture (apps/api/prisma/seed.ts's single
// SEED-PENDING row) — a single seed row can't serve two tests when the
// first test's own action (confirming it) consumes it.
async function createPendingBooking(request: APIRequestContext): Promise<string> {
  const uniquePhone = `05${Math.floor(10000000 + Math.random() * 89999999)}`;
  const registerRes = await request.post("http://localhost:4000/api/v1/auth/register", {
    data: { fullName: "Pricing Test Customer", phone: uniquePhone, password: "correct-horse-battery" },
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
    headers: { ...authHeaders, "Idempotency-Key": `pricing-test-${Date.now()}-${Math.random()}` },
    data: {
      quoteId: quote.id,
      addressId: address.id,
      propertyType: "VILLA",
      preferredDate: new Date(Date.now() + 86400000).toISOString(),
      contactName: "Pricing Test Customer",
      contactPhone: uniquePhone,
      consentAccepted: true,
    },
  });
  const booking = await bookingRes.json();
  return booking.id as string;
}

test.describe("Admin reviews, prices, and confirms a booking (User Story 3)", () => {
  test("confirms a pending booking with a price override and reason", async ({ page, request }) => {
    const bookingId = await createPendingBooking(request);

    await page.goto("/admin/login");
    await page.getByLabel(/رقم الجوال أو البريد|Mobile number or email/).fill("admin@nuqaa-asir.local");
    await page.getByLabel(/كلمة المرور|Password/).fill("ChangeMe123!");
    await page.getByRole("button", { name: /إرسال|Submit/ }).click();
    await page.waitForURL(/\/admin$/);

    await page.goto(`/admin/bookings/${bookingId}`);

    await page.getByRole("button", { name: /Confirm Booking|تأكيد الحجز/ }).click();
    await page.getByLabel(/Price Override \(SAR, optional\)|تجاوز السعر/).fill("350");
    await page.getByLabel(/Override Reason|سبب التجاوز/).fill("Loyal customer discount");

    const confirmResponse = page.waitForResponse(
      (res) => res.url().includes("/confirm") && res.request().method() === "POST"
    );
    await page.getByRole("button", { name: /^(Confirm|تأكيد)$/ }).click();
    const response = await confirmResponse;
    expect(response.status()).toBe(200);

    await expect(page.getByText("CONFIRMED")).toBeVisible();
  });

  test("blocks confirming a price override without a reason", async ({ page, request }) => {
    const bookingId = await createPendingBooking(request);

    await page.goto("/admin/login");
    await page.getByLabel(/رقم الجوال أو البريد|Mobile number or email/).fill("admin@nuqaa-asir.local");
    await page.getByLabel(/كلمة المرور|Password/).fill("ChangeMe123!");
    await page.getByRole("button", { name: /إرسال|Submit/ }).click();
    await page.waitForURL(/\/admin$/);

    await page.goto(`/admin/bookings/${bookingId}`);
    await page.getByRole("button", { name: /Confirm Booking|تأكيد الحجز/ }).click();
    await page.getByLabel(/Price Override \(SAR, optional\)|تجاوز السعر/).fill("350");
    await page.getByRole("button", { name: /^(Confirm|تأكيد)$/ }).click();

    await expect(page.getByText(/A reason is required when overriding the price|السبب مطلوب عند تجاوز السعر/)).toBeVisible();
  });
});
