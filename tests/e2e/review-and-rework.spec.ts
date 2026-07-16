import { test, expect } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";

// Implements quickstart.md V6. Requires both apps running + a live
// PostgreSQL database with a seeded Admin account, an active service with a
// published checklist template (home-cleaning), and a service area — not
// runnable in this sandbox. Selectors verified against
// apps/web/src/customer/pages/{ReviewForm,ComplaintForm,BookingDetail}.tsx
// and apps/web/src/admin/pages/quality/{Complaints,ComplaintDetail,ReworkDialog}.tsx.
//
// The COMPLETED booking is created end-to-end via the API (not the shared
// seed fixture) so this test owns its own customer/booking and doesn't
// depend on — or fight over — a row left behind by another spec file.
async function createCompletedBooking(request: APIRequestContext): Promise<{
  bookingId: string;
  customerPhone: string;
}> {
  const uniquePhone = `05${Math.floor(10000000 + Math.random() * 89999999)}`;
  const registerRes = await request.post("http://localhost:4000/api/v1/auth/register", {
    data: { fullName: "Review Test Customer", phone: uniquePhone, password: "correct-horse-battery" },
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
      propertySizeInput: { sizeMultiplier: 3, conditionModifiers: [] },
      addressId: address.id,
      requestedDate: new Date(Date.now() + 86400000).toISOString(),
    },
  });
  const quote = await quoteRes.json();

  const bookingRes = await request.post("http://localhost:4000/api/v1/bookings", {
    headers: { ...authHeaders, "Idempotency-Key": `review-test-${Date.now()}-${Math.random()}` },
    data: {
      quoteId: quote.id,
      addressId: address.id,
      propertyType: "VILLA",
      preferredDate: new Date(Date.now() + 86400000).toISOString(),
      contactName: "Review Test Customer",
      contactPhone: uniquePhone,
      consentAccepted: true,
    },
  });
  const booking = await bookingRes.json();

  const adminLoginRes = await request.post("http://localhost:4000/api/v1/auth/login", {
    data: { identifier: "admin@nuqaa-asir.local", password: "ChangeMe123!" },
  });
  const { accessToken: adminToken } = await adminLoginRes.json();
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  await request.post(`http://localhost:4000/api/v1/bookings/${booking.id}/confirm`, {
    headers: adminHeaders,
    data: {},
  });

  const slotsRes = await request.get("http://localhost:4000/api/v1/time-slots", { headers: adminHeaders });
  const slots = await slotsRes.json();
  const availableSlot = slots.find((s: { bookedCount: number; capacity: number }) => s.bookedCount < s.capacity);
  await request.post(`http://localhost:4000/api/v1/bookings/${booking.id}/schedule`, {
    headers: adminHeaders,
    data: { timeSlotId: availableSlot.id },
  });

  await request.post(`http://localhost:4000/api/v1/bookings/${booking.id}/arrive`, { headers: adminHeaders });
  await request.post(`http://localhost:4000/api/v1/bookings/${booking.id}/start`, { headers: adminHeaders });

  const runRes = await request.get(`http://localhost:4000/api/v1/bookings/${booking.id}/checklist`, {
    headers: adminHeaders,
  });
  const run = await runRes.json();
  await request.patch(`http://localhost:4000/api/v1/bookings/${booking.id}/checklist`, {
    headers: adminHeaders,
    data: {
      results: run.template.items.map((item: { id: string; type: string }) => ({
        templateItemId: item.id,
        value: item.type === "YES_NO" ? true : item.type === "SIGNATURE" ? "Playwright Test" : undefined,
      })),
    },
  });

  await request.post(`http://localhost:4000/api/v1/bookings/${booking.id}/complete`, { headers: adminHeaders });

  return { bookingId: booking.id as string, customerPhone: uniquePhone };
}

test.describe("Customer review, complaint, and Admin rework (User Story 6)", () => {
  test("a low rating auto-opens a quality issue the Admin can resolve with a rework booking", async ({
    page,
    request,
  }) => {
    const { bookingId, customerPhone } = await createCompletedBooking(request);

    // Customer leaves a low rating on their completed booking.
    await page.goto("/login");
    await page.getByLabel(/رقم الجوال أو البريد|Mobile number or email/).fill(customerPhone);
    await page.getByLabel(/كلمة المرور|Password/).fill("correct-horse-battery");
    await page.getByRole("button", { name: /إرسال|Submit/ }).click();
    await page.waitForURL(/\/bookings$/);

    await page.goto(`/bookings/${bookingId}`);
    await page.getByRole("link", { name: /Rate This Service|تقييم هذه الخدمة/ }).click();

    // Ant Design's Rate renders radio-like elements; select the lowest star.
    await page.locator(".ant-rate-star").first().click();
    const reviewResponse = page.waitForResponse(
      (res) => res.url().includes("/review") && res.request().method() === "POST"
    );
    await page.getByRole("button", { name: /Submit Review|إرسال التقييم/ }).click();
    await reviewResponse;

    // Admin sees the resulting quality issue and creates a rework booking.
    await page.goto("/admin/login");
    await page.getByLabel(/رقم الجوال أو البريد|Mobile number or email/).fill("admin@nuqaa-asir.local");
    await page.getByLabel(/كلمة المرور|Password/).fill("ChangeMe123!");
    await page.getByRole("button", { name: /إرسال|Submit/ }).click();
    await page.waitForURL(/\/admin$/);

    // The Reviews list (apps/web/src/admin/pages/quality/Reviews.tsx) shows
    // no booking reference to click by, so resolve this test's own
    // auto-opened QualityIssue via the API and navigate directly.
    const adminLoginRes = await request.post("http://localhost:4000/api/v1/auth/login", {
      data: { identifier: "admin@nuqaa-asir.local", password: "ChangeMe123!" },
    });
    const { accessToken: adminToken } = await adminLoginRes.json();
    const issuesRes = await request.get("http://localhost:4000/api/v1/quality-issues?source=REVIEW", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const issues = await issuesRes.json();
    const issue = issues.items.find((i: { bookingId: string }) => i.bookingId === bookingId);

    await page.goto(`/admin/quality/${issue.id}`);

    await page.getByRole("button", { name: /Create Rework Booking|إنشاء حجز إعادة تنفيذ/ }).click();
    const reworkResponse = page.waitForResponse(
      (res) => res.url().includes("/rework") && res.request().method() === "POST"
    );
    await page.getByRole("button", { name: /^(Create|إنشاء)$/ }).click();
    const response = await reworkResponse;
    expect(response.status()).toBe(201);
  });
});
