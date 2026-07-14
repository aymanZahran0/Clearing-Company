import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const JOBS_DIR = join(__dirname, "../../src/jobs");
const SRC_DIR = join(__dirname, "../../src");

function listFilesRecursive(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return listFilesRecursive(full);
    return entry.name.endsWith(".ts") ? [full] : [];
  });
}

// T186: FR-081/Clarifications — no automatic deletion/anonymization job may
// ever be introduced; data-model.md's Data Retention section is
// authoritative. This test fails loudly (rather than silently) if one
// slips in.
describe("Data retention: no deletion/anonymization job exists (FR-081)", () => {
  it("no job file name suggests deletion/retention/anonymization/purge", () => {
    const jobFiles = listFilesRecursive(JOBS_DIR).map((f) => f.toLowerCase());
    const forbidden = jobFiles.filter((f) =>
      /delet|anonymiz|purge|retention|cleanup/.test(f)
    );
    expect(forbidden).toEqual([]);
  });

  it("no job file body calls a bulk `.deleteMany(` or `.delete(` against customer/booking data", () => {
    const jobFiles = listFilesRecursive(JOBS_DIR);
    for (const file of jobFiles) {
      const content = readFileSync(file, "utf-8");
      expect(content, `${file} must not delete records`).not.toMatch(/\.deleteMany\(|\.delete\(/);
    }
  });
});

// T186: FR-064/Clarifications — explicitly no online payment gateway;
// payments are Admin-recorded only (CASH/BANK_TRANSFER/POS/COMPLIMENTARY/
// OTHER). This guards against a gateway integration being added later
// without an explicit product decision to revisit that constraint.
//
// Checks `package.json` dependencies (exact package-name match) rather
// than grepping source text for a substring: naive substring matching
// against arbitrary source (e.g. `reencodeAndStripExif` lowercased
// contains "stripe") produces false positives on unrelated code.
describe("No online payment gateway integration exists (FR-064)", () => {
  it("apps/api's package.json declares no known payment-gateway SDK as a dependency", () => {
    const forbiddenPackages = [
      "stripe",
      "paypal",
      "moyasar",
      "hyperpay",
      "tap-payments",
      "braintree",
      "@paypal/checkout-server-sdk",
    ];
    const pkg = JSON.parse(readFileSync(join(__dirname, "../../package.json"), "utf-8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const declared = new Set([
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
    ]);
    const found = forbiddenPackages.filter((name) => declared.has(name));
    expect(found).toEqual([]);
  });

  it("no source file imports from a known payment-gateway package", () => {
    const forbiddenPackages = ["stripe", "paypal", "moyasar", "hyperpay", "tap-payments", "braintree"];
    const importPattern = new RegExp(
      `from\\s+["'](${forbiddenPackages.join("|")})["']|require\\(["'](${forbiddenPackages.join("|")})["']\\)`,
      "i"
    );
    const srcFiles = listFilesRecursive(SRC_DIR);
    for (const file of srcFiles) {
      const content = readFileSync(file, "utf-8");
      expect(content, `${file} must not import a payment-gateway package`).not.toMatch(importPattern);
    }
  });
});
