import { test, expect } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";

// Implements quickstart.md V7. Requires both apps running + a live
// PostgreSQL database with a seeded Admin account, an active service, and a
// service area — not runnable in this sandbox. Selectors verified against
// apps/web/src/admin/pages/subscriptions/{List,Editor}.tsx.
//
// Creates its own customer + address via the API rather than depending on a
// specific hardcoded phone number ("0512340001") existing in the seed data
// (apps/api/prisma/seed.ts's sample customer has a different phone).
const BASE = "http://localhost:4000/api/v1";
const CUSTOMER_PHONE = "0512340001";

async function ensureCustomerWithAddress(request: APIRequestContext): Promise<void> {
  const registerRes = await request.post(`${BASE}/auth/register`, {
    data: { fullName: "Subscription Test Customer", phone: CUSTOMER_PHONE, password: "correct-horse-battery" },
  });
  // Already exists from a prior run — that's fine, it still has an address.
  if (registerRes.status() === 409) return;

  const { accessToken } = await registerRes.json();
  const areasRes = await request.get(`${BASE}/service-areas`);
  const [area] = await areasRes.json();
  await request.post(`${BASE}/addresses/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { city: area.city, neighborhood: "Al Numan", serviceAreaId: area.id },
  });
}

test.describe("Admin manages a recurring subscription (User Story 7)", () => {
  test("creates a subscription and pauses it", async ({ page, request }) => {
    await ensureCustomerWithAddress(request);

    await page.goto("/admin/login");
    await page.getByLabel(/رقم الجوال أو البريد|Mobile number or email/).fill("admin@nuqaa-asir.local");
    await page.getByLabel(/كلمة المرور|Password/).fill("ChangeMe123!");
    await page.getByRole("button", { name: /إرسال|Submit/ }).click();
    await page.waitForURL(/\/admin$/);

    await page.goto("/admin/subscriptions/new");

    await page.getByLabel(/^(Customer|العميل)$/).click();
    await page.getByText(CUSTOMER_PHONE).click();

    // Keyboard-driven selection sidesteps Ant Design's Select DOM quirks
    // (an ARIA-only zero-size listbox alongside the real visible options,
    // and a just-closed dropdown's options lingering in the DOM) that make
    // class-based option clicking unreliable across several selects on one
    // page. The first option is highlighted by default when a Select
    // opens, so Enter selects it.
    await page.getByLabel(/^(Address|العنوان)$/).click();
    await page.keyboard.press("Enter");
    await page.getByLabel(/^(Service|الخدمة)$/).click();
    await page.keyboard.press("Enter");
    await page.getByLabel(/^(Frequency|التكرار)$/).click();
    await page.keyboard.press("Enter"); // WEEKLY is the first option
    await page.getByLabel(/Price \(SAR\)|السعر \(ريال\)/).fill("200");
    await page.getByLabel(/Starts On|تاريخ البدء/).fill(new Date().toISOString().slice(0, 10));

    const createResponse = page.waitForResponse(
      (res) => res.url().endsWith("/subscriptions") && res.request().method() === "POST"
    );
    await page.getByRole("button", { name: /Create Subscription|إنشاء اشتراك/ }).click();
    const response = await createResponse;
    expect(response.status()).toBe(201);

    await page.getByRole("button", { name: /^(Pause|إيقاف مؤقت)$/ }).click();
    // Status value is now localized (enumLabel) — "متوقف مؤقتًا" is Arabic default.
    await expect(page.getByText(/Status: PAUSED|الحالة: متوقف مؤقتًا/)).toBeVisible();
  });
});
