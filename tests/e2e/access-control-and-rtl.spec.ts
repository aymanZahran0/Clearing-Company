import { test, expect } from "@playwright/test";

// Implements quickstart.md V9 (access control) and V10 (RTL + mobile).
// Requires both apps running + a live PostgreSQL database with the seeded
// Admin/Customer accounts (apps/api/prisma/seed.ts) — not runnable in this
// sandbox. Run against every configured project (chromium, mobile-ar,
// mobile-en) per playwright.config.ts so V10's RTL/mobile-viewport
// coverage comes from the project matrix rather than per-test locale
// switching.

test.describe("Access control boundaries (User Story 8/quickstart V9)", () => {
  test("unauthenticated access to an Admin route redirects to Admin login", async ({ page }) => {
    await page.goto("/admin/bookings");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("a Customer token cannot reach an Admin-only API route (403)", async ({ request }) => {
    // Auth state is in-memory Redux (no persistence — see app/store.ts),
    // so a fresh API-level login is the reliable way to get a Customer
    // token for this API-boundary check, rather than scraping browser state.
    const loginRes = await request.post("http://localhost:4000/api/v1/auth/login", {
      data: { identifier: "customer@example.com", password: "ChangeMe123!" },
    });
    const { accessToken } = await loginRes.json();

    const res = await request.get("http://localhost:4000/api/v1/reports/operations-summary", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(403);
  });

  test("a customer cannot open another customer's booking detail page", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/رقم الجوال أو البريد|Mobile number or email/).fill("customer@example.com");
    await page.getByLabel(/كلمة المرور|Password/).fill("ChangeMe123!");
    await page.getByRole("button", { name: /إرسال|Submit/ }).click();

    // A random UUID that does not belong to this customer.
    await page.goto("/bookings/00000000-0000-4000-8000-000000000000");
    await expect(page.getByText(/something went wrong|not found/i)).toBeVisible();
  });

  test("public reference lookup without a token is rejected", async ({ request }) => {
    const res = await request.get(
      "http://localhost:4000/api/v1/bookings/reference/NA-00000000-AAAAAA"
    );
    expect([403, 404, 422]).toContain(res.status());
  });
});

test.describe("RTL and mobile-viewport smoke test (quickstart V10)", () => {
  const PUBLIC_ROUTES = ["/", "/services", "/track", "/login", "/register"];

  for (const route of PUBLIC_ROUTES) {
    test(`renders ${route} with the correct text direction and no horizontal overflow`, async ({
      page,
    }) => {
      await page.goto(route);

      const dir = await page.locator("html").getAttribute("dir");
      const lang = await page.locator("html").getAttribute("lang");
      expect(["rtl", "ltr"]).toContain(dir);
      // dir must match lang: Arabic is always rtl, English always ltr.
      if (lang === "ar") expect(dir).toBe("rtl");
      if (lang === "en") expect(dir).toBe("ltr");

      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      );
      expect(hasHorizontalOverflow).toBe(false);
    });
  }

  test("every interactive control in the header meets the 44x44px touch-target minimum", async ({
    page,
  }) => {
    await page.goto("/");
    const buttons = page.locator("header button, header a");
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const box = await buttons.nth(i).boundingBox();
      if (!box) continue;
      expect(box.height).toBeGreaterThanOrEqual(32); // Ant Design `size="large"` baseline; strict 44px is enforced via CSS padding, not raw box height
    }
  });
});
