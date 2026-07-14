import { test, expect } from "@playwright/test";

// Implements quickstart.md V5. Requires both apps running + a live
// PostgreSQL database with a CONFIRMED-and-scheduled booking for a service
// that has a published checklist template — not runnable in this sandbox.
// Selectors verified against apps/web/src/admin/pages/bookings/Detail.tsx
// and ChecklistRunner.tsx.
test.describe("Admin executes a booking and completes the quality checklist (User Story 5)", () => {
  test("walks arrival through completion, blocked until required items are answered", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel(/رقم الجوال أو البريد|Mobile number or email/).fill("admin@nuqaa-asir.local");
    await page.getByLabel(/كلمة المرور|Password/).fill("ChangeMe123!");
    await page.getByRole("button", { name: /إرسال|Submit/ }).click();

    await page.goto("/admin/bookings");
    await page.locator("tr", { hasText: "CONFIRMED" }).first().click();

    await page.getByRole("button", { name: "Arrived" }).click();
    await expect(page.getByRole("button", { name: "Start" })).toBeEnabled();
    await page.getByRole("button", { name: "Start" }).click();

    await expect(page.getByText("Quality Checklist")).toBeVisible();

    // Completing before any required item is answered should surface the
    // server's 409 + outstanding-items error rather than transition status.
    await page.getByRole("button", { name: "Complete Booking" }).click();
    await expect(page.getByText(/could not complete/i)).toBeVisible();

    // Answer every required item, then complete successfully.
    const yesButtons = page.getByRole("radio", { name: "Yes" });
    const count = await yesButtons.count();
    for (let i = 0; i < count; i++) {
      await yesButtons.nth(i).check();
    }
    await page.getByRole("button", { name: "Save Checklist" }).click();

    const completeResponse = page.waitForResponse(
      (res) => res.url().includes("/complete") && res.request().method() === "POST"
    );
    await page.getByRole("button", { name: "Complete Booking" }).click();
    const response = await completeResponse;
    expect(response.status()).toBe(200);
    await expect(page.getByText("COMPLETED")).toBeVisible();
  });
});
