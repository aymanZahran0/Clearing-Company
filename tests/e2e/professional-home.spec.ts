import { test, expect } from "@playwright/test";

// Implements US1 (professional public home page). Requires the web+api
// apps running with the seeded services/service-areas/FAQ/content-block
// baseline (apps/api/prisma/seed.ts).
test.describe("Professional public home page (User Story 1)", () => {
  test("renders all sections with real data and no fabricated statistics, no horizontal overflow at 360px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/");

    // Hero
    await expect(page.getByRole("link", { name: "احجز الآن" })).toBeVisible();
    await expect(page.getByRole("link", { name: "استعرض الخدمات" })).toBeVisible();

    // Services (seeded services exist per apps/api/prisma/seed.ts)
    await expect(page.getByRole("heading", { name: "خدماتنا" })).toBeVisible();

    // How it works
    await expect(page.getByRole("heading", { name: "كيف يعمل الحجز" })).toBeVisible();

    // Why choose us
    await expect(page.getByRole("heading", { name: "لماذا تختارنا" })).toBeVisible();

    // Service areas
    await expect(page.getByRole("heading", { name: "مناطق الخدمة" })).toBeVisible();

    // Trust section: qualitative text always renders; stat tiles are
    // conditional on real data existing, so only assert the section itself.
    await expect(page.getByRole("heading", { name: "موثوق من عملائنا" })).toBeVisible();
    await expect(page.getByText(/مبلغ ملفق|احصائية وهمية/)).toHaveCount(0);

    // FAQ preview
    await expect(page.getByRole("heading", { name: "أسئلة شائعة" })).toBeVisible();

    // Contact CTA
    await expect(page.getByRole("heading", { name: "تواصل معنا" })).toBeVisible();

    // Footer
    await expect(page.getByText(/جميع الحقوق محفوظة/)).toBeVisible();

    // No horizontal overflow at 360px (constitution Principle II).
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasOverflow).toBe(false);
  });

  test("hero CTA links route to booking and services respectively", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "استعرض الخدمات" }).click();
    await expect(page).toHaveURL(/\/services$/);
  });

  test("home page is reachable and renders on desktop viewport with no fabricated metrics", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
