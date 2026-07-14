import { test, expect } from "@playwright/test";

// Implements quickstart.md V7. Requires both apps running + a live
// PostgreSQL database with at least one customer/address/service seeded —
// not runnable in this sandbox. Selectors verified against
// apps/web/src/admin/pages/subscriptions/{List,Editor}.tsx.
test.describe("Admin manages a recurring subscription (User Story 7)", () => {
  test("creates a subscription and pauses it", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel(/رقم الجوال أو البريد|Mobile number or email/).fill("admin@nuqaa-asir.local");
    await page.getByLabel(/كلمة المرور|Password/).fill("ChangeMe123!");
    await page.getByRole("button", { name: /إرسال|Submit/ }).click();

    await page.goto("/admin/subscriptions/new");
    await page.getByPlaceholder("Search by phone").fill("0512340001");
    await page.getByPlaceholder("Search by phone").press("Enter");
    await page.locator(".ant-list-item").first().click();

    await page.getByLabel("Address").click();
    await page.getByRole("option").first().click();
    await page.getByLabel("Service").click();
    await page.getByRole("option").first().click();
    await page.getByLabel("Frequency").click();
    await page.getByRole("option", { name: "WEEKLY" }).click();
    await page.getByLabel("Price (SAR)").fill("200");
    await page.getByLabel("Starts On").fill(new Date().toISOString().slice(0, 10));

    const createResponse = page.waitForResponse(
      (res) => res.url().endsWith("/subscriptions") && res.request().method() === "POST"
    );
    await page.getByRole("button", { name: "Create Subscription" }).click();
    const response = await createResponse;
    expect(response.status()).toBe(201);

    await page.getByRole("button", { name: "Pause" }).click();
    await expect(page.getByText("Status: PAUSED")).toBeVisible();
  });
});
