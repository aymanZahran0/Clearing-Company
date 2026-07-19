import { test, expect } from "@playwright/test";

// T182: WCAG 2.1 AA audit across the Customer Portal and Admin Dashboard.
// Requires `@axe-core/playwright` (declared in package.json devDependencies)
// — this sandbox could not `npm install` it (registry TLS/network
// restricted here). The import below is deliberately dynamic (inside each
// test body, not a top-level `import`) so a missing package only fails
// *these* tests at run time with a clear "module not found" error, rather
// than breaking Playwright's static test collection for the entire E2E
// suite (a top-level import of an unresolved module does that). Once
// `npm install` succeeds in an environment with registry access, these
// tests run as-is. Also requires both apps running + a live PostgreSQL
// database with the seeded Admin/Customer accounts, same as every other
// E2E spec.

const CUSTOMER_PORTAL_ROUTES = ["/", "/services", "/login", "/register", "/track"];

async function loadAxeBuilder() {
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  return AxeBuilder;
}

test.describe("Accessibility (WCAG 2.1 AA)", () => {
  for (const route of CUSTOMER_PORTAL_ROUTES) {
    test(`Customer Portal ${route} has no WCAG 2.1 AA violations`, async ({ page }) => {
      const AxeBuilder = await loadAxeBuilder();
      await page.goto(route);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    });
  }

  test("Admin login has no WCAG 2.1 AA violations", async ({ page }) => {
    const AxeBuilder = await loadAxeBuilder();
    await page.goto("/admin/login");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test("Admin Dashboard (post-login) has no WCAG 2.1 AA violations", async ({ page }) => {
    const AxeBuilder = await loadAxeBuilder();
    await page.goto("/admin/login");
    await page.getByLabel(/رقم الجوال أو البريد|Mobile number or email/).fill("admin@nuqaa-asir.local");
    await page.getByLabel(/كلمة المرور|Password/).fill("ChangeMe123!");
    await page.getByRole("button", { name: /إرسال|Submit/ }).click();
    await page.waitForURL("/admin");

    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test("Admin Dashboard sidebar/content independent scroll (T042) has no WCAG 2.1 AA violations at 360px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const AxeBuilder = await loadAxeBuilder();
    await page.goto("/admin/login");
    await page.getByLabel(/رقم الجوال أو البريد|Mobile number or email/).fill("admin@nuqaa-asir.local");
    await page.getByLabel(/كلمة المرور|Password/).fill("ChangeMe123!");
    await page.getByRole("button", { name: /إرسال|Submit/ }).click();
    await page.waitForURL("/admin");

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasOverflow).toBe(false);

    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});
