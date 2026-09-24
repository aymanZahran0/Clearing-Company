import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("production report export", () => {
  it("uses the shared same-origin API base instead of bypassing the Vercel rewrite", () => {
    const source = readFileSync(resolve(process.cwd(), "src/admin/pages/reports/Export.tsx"), "utf8");

    expect(source).toContain('import { apiBaseUrl } from "../../../api/baseApi"');
    expect(source).toContain("`${apiBaseUrl}/reports/export.xlsx?");
    expect(source).not.toContain("import.meta.env.VITE_API_BASE_URL");
  });
});
