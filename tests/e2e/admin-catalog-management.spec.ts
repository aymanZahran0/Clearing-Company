import { test, expect } from "@playwright/test";

// Implements US4 (Admin catalog management). Requires both apps running +
// a live PostgreSQL database with a seeded Admin account. Image upload is
// intentionally NOT exercised here — apps/api/src/lib/storage/factory.ts
// requires a real S3-compatible endpoint with no local-disk fallback,
// which is outside this session's scope (deferred alongside the rest of
// US9's external-storage verification).
test.describe("Admin manages the service catalog (User Story 4)", () => {
  test("create category -> add service/add-on -> activate -> bookable on /services, deactivate -> hidden", async ({
    page,
  }) => {
    await page.goto("/admin/login");
    await page.getByLabel(/رقم الجوال أو البريد|Mobile number or email/).fill("admin@nuqaa-asir.local");
    await page.getByLabel(/كلمة المرور|Password/).fill("ChangeMe123!");
    await page.getByRole("button", { name: /إرسال|Submit/ }).click();
    await page.waitForURL(/\/admin$/);

    const suffix = Date.now();
    const categoryName = `Catalog Test Category ${suffix}`;
    const serviceName = `Catalog Test Service ${suffix}`;
    const serviceNameAr = `خدمة اختبار ${suffix}`;
    const addOnName = `Catalog Test AddOn ${suffix}`;

    // Create category.
    await page.goto("/admin/catalog/categories");
    await page.getByRole("button", { name: /New Category|فئة جديدة/ }).click();
    await page.getByLabel(/^(Title \(English\)|العنوان \(إنجليزي\))$/).fill(categoryName);
    await page.getByLabel(/^(Title \(Arabic\)|العنوان \(عربي\))$/).fill(`فئة اختبار ${suffix}`);
    await page.getByLabel(/^(Slug|المعرّف النصي)$/).fill(`catalog-test-category-${suffix}`);
    const createCategoryResponse = page.waitForResponse(
      (res) => res.url().includes("/service-categories") && res.request().method() === "POST"
    );
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /Save|حفظ/ })
      .click();
    expect((await createCategoryResponse).status()).toBe(201);
    await expect(page.locator("tr", { hasText: categoryName })).toBeVisible();

    // Create service under that category, with pricing configured so it
    // reads as bookable immediately (no separate PricingRules step needed
    // for FIXED pricing).
    await page.goto("/admin/catalog/services");
    await page.getByRole("button", { name: /New Service|خدمة جديدة/ }).click();
    await page.getByLabel(/^(Category|الفئة)$/).click();
    await page.locator(".ant-select-item-option", { hasText: categoryName }).click();
    await page.getByLabel(/^(Title \(English\)|العنوان \(إنجليزي\))$/).fill(serviceName);
    await page.getByLabel(/^(Title \(Arabic\)|العنوان \(عربي\))$/).fill(serviceNameAr);
    await page.getByLabel(/^(Slug|المعرّف النصي)$/).fill(`catalog-test-service-${suffix}`);
    await page.getByLabel(/^(Base Price \(SAR\)|السعر الأساسي \(ريال\))$/).fill("150");
    const createServiceResponse = page.waitForResponse(
      (res) => res.url().includes("/services") && res.request().method() === "POST"
    );
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /Save|حفظ/ })
      .click();
    expect((await createServiceResponse).status()).toBe(201);
    await expect(page.locator("tr", { hasText: serviceName })).toBeVisible();

    // Add an add-on assigned to that service.
    await page.goto("/admin/catalog/add-ons");
    await page.getByRole("button", { name: /New Add-On|خدمة إضافية جديدة/ }).click();
    await page.getByLabel(/Select a service|اختر خدمة/).click();
    await page.locator(".ant-select-item-option", { hasText: serviceName }).click();
    await page.getByLabel(/^(Title \(English\)|العنوان \(إنجليزي\))$/).fill(addOnName);
    await page.getByLabel(/^(Title \(Arabic\)|العنوان \(عربي\))$/).fill(`إضافة اختبار ${suffix}`);
    await page.getByLabel(/^(Unit Price \(SAR\)|سعر الوحدة \(ريال\))$/).fill("25");
    const createAddOnResponse = page.waitForResponse(
      (res) => res.url().includes("/service-add-ons") && res.request().method() === "POST"
    );
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /Save|حفظ/ })
      .click();
    expect((await createAddOnResponse).status()).toBe(201);
    await expect(page.locator("tr", { hasText: addOnName })).toBeVisible();

    // Verify bookable on the public /services page. The catalog card
    // renders nameAr in the default (Arabic) locale — see
    // customer/pages/ServiceCatalog.tsx.
    await page.goto("/services");
    await expect(page.getByText(serviceNameAr)).toBeVisible();

    // Deactivate the service (FR-025) and confirm it disappears from the
    // public listing immediately.
    await page.goto("/admin/catalog/services");
    const serviceRow = page.locator("tr", { hasText: serviceName });
    const deactivateResponse = page.waitForResponse(
      (res) => res.url().includes("/services/") && res.request().method() === "DELETE"
    );
    await serviceRow.getByRole("button", { name: /Deactivate|تعطيل/ }).click();
    expect((await deactivateResponse).status()).toBe(204);
    await expect(serviceRow.getByText(/Disabled|معطّل/)).toBeVisible();

    await page.goto("/services");
    await expect(page.getByText(serviceNameAr)).not.toBeVisible();
  });
});
