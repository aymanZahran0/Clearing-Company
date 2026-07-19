import { test, expect } from "@playwright/test";

// Implements US2 (custom 404/route-error handling). Requires the web app
// running; the canonical-route checks don't need a live database.
test.describe("Route handling and error pages (User Story 2)", () => {
  test("canonical customer/admin auth routes resolve to their intended pages", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: /إرسال|Submit/ })).toBeVisible();

    await page.goto("/register");
    await expect(page.getByLabel(/الاسم الكامل|Full Name/)).toBeVisible();

    await page.goto("/forgot-password");
    await expect(page).toHaveURL(/\/forgot-password$/);

    await page.goto("/reset-password");
    await expect(page).toHaveURL(/\/reset-password$/);

    await page.goto("/admin/login");
    await expect(page.getByRole("button", { name: /إرسال|Submit/ })).toBeVisible();
  });

  test("an unknown route shows the branded Arabic 404 page with Home and Back actions", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");

    await expect(page.getByText("الصفحة غير موجودة")).toBeVisible();
    await expect(page.getByRole("link", { name: "العودة للرئيسية" })).toBeVisible();
    await expect(page.getByRole("button", { name: "الرجوع للخلف" })).toBeVisible();

    await page.getByRole("link", { name: "العودة للرئيسية" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("unauthenticated access to a protected route redirects to login rather than showing 404", async ({
    page,
  }) => {
    await page.goto("/bookings");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText("الصفحة غير موجودة")).not.toBeVisible();
  });

  test("unauthenticated access to an Admin-only route redirects to admin login rather than showing 404", async ({
    page,
  }) => {
    await page.goto("/admin/accounts");
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByText("الصفحة غير موجودة")).not.toBeVisible();
  });
});
