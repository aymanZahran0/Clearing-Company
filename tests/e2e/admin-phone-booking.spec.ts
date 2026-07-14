import { test, expect } from "@playwright/test";

// Implements quickstart.md V2. Requires both apps running + a live
// PostgreSQL database with a seeded Admin account — not runnable in this
// sandbox. Selectors verified against apps/web/src/admin/pages/bookings/NewPhoneBooking.tsx.
test.describe("Admin creates a booking from a phone/WhatsApp call (User Story 2)", () => {
  test("completes every step for a new customer without any customer-side interaction", async ({
    page,
  }) => {
    await page.goto("/admin/login");
    await page.getByLabel(/رقم الجوال أو البريد|Mobile number or email/).fill("admin@nuqaa-asir.local");
    await page.getByLabel(/كلمة المرور|Password/).fill("ChangeMe123!");
    await page.getByRole("button", { name: /إرسال|Submit/ }).click();
    await expect(page).toHaveURL(/\/admin$/);

    await page.getByRole("link", { name: "New Phone Booking" }).click();
    await expect(page).toHaveURL(/\/admin\/bookings\/new/);

    const uniquePhone = `05${Math.floor(10000000 + Math.random() * 89999999)}`;
    await page.getByLabel(/الاسم الكامل|Full Name/).fill("Phone Caller");
    await page.getByLabel(/رقم الجوال|Mobile Number/).fill(uniquePhone);
    await page.getByRole("button", { name: /تأكيد|Confirm/ }).first().click();

    // Address step
    await page.getByLabel("Service Area").click();
    await page.locator(".ant-select-item-option").first().click();
    await page.getByLabel("City").fill("Khamis Mushait");
    await page.getByLabel("Neighborhood").fill("Al Sad");
    await page.getByRole("button", { name: /تأكيد|Confirm/ }).click();

    // Service + property step
    await page.getByLabel("Villa").check();
    await page.locator('input[type="date"]').fill("2026-08-01");
    await page.getByLabel("Service").click();
    await page.locator(".ant-select-item-option").first().click();
    await page.getByRole("button", { name: /تأكيد|Confirm/ }).click();

    // Confirm step
    const submitResponse = page.waitForResponse(
      (res) => res.url().includes("/bookings/admin") && res.request().method() === "POST"
    );
    await page.getByRole("button", { name: /تأكيد|Confirm/ }).click();
    const response = await submitResponse;
    expect(response.status()).toBe(201);
  });
});
