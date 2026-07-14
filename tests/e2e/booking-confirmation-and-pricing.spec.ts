import { test, expect } from "@playwright/test";

// Implements quickstart.md V3. Requires both apps running + a live
// PostgreSQL database with a PENDING booking already present (e.g. from
// the customer-registration-and-booking flow) and a seeded Admin account —
// not runnable in this sandbox. Selectors verified against
// apps/web/src/admin/pages/bookings/{List,Detail,ConfirmDialog,RejectDialog}.tsx.
test.describe("Admin reviews, prices, and confirms a booking (User Story 3)", () => {
  test("confirms a pending booking with a price override and reason", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel(/رقم الجوال أو البريد|Mobile number or email/).fill("admin@nuqaa-asir.local");
    await page.getByLabel(/كلمة المرور|Password/).fill("ChangeMe123!");
    await page.getByRole("button", { name: /إرسال|Submit/ }).click();

    await page.goto("/admin/bookings");
    await page.locator("tr", { hasText: "PENDING" }).first().click();

    await page.getByRole("button", { name: "Confirm Booking" }).click();
    await page.getByLabel("Price Override (SAR, optional)").fill("350");
    await page.getByLabel("Override Reason").fill("Loyal customer discount");

    const confirmResponse = page.waitForResponse(
      (res) => res.url().includes("/confirm") && res.request().method() === "POST"
    );
    await page.getByRole("button", { name: "Confirm", exact: true }).click();
    const response = await confirmResponse;
    expect(response.status()).toBe(200);

    await expect(page.getByText("CONFIRMED")).toBeVisible();
  });

  test("blocks confirming a price override without a reason", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel(/رقم الجوال أو البريد|Mobile number or email/).fill("admin@nuqaa-asir.local");
    await page.getByLabel(/كلمة المرور|Password/).fill("ChangeMe123!");
    await page.getByRole("button", { name: /إرسال|Submit/ }).click();

    await page.goto("/admin/bookings");
    await page.locator("tr", { hasText: "PENDING" }).first().click();
    await page.getByRole("button", { name: "Confirm Booking" }).click();
    await page.getByLabel("Price Override (SAR, optional)").fill("350");
    await page.getByRole("button", { name: "Confirm", exact: true }).click();

    await expect(page.getByText("A reason is required when overriding the price")).toBeVisible();
  });
});
