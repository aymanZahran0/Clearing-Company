import { Router } from "express";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// contracts/openapi.yaml is the single source of truth for the API surface
// (plan.md "Generated Artifacts"); served as-is rather than duplicated.
const openapiPath = path.resolve(
  __dirname,
  "../../../../specs/001-cleaning-company-platform/contracts/openapi.yaml"
);

export const openapiRouter = Router();

openapiRouter.get("/docs", (_req, res) => {
  try {
    const contents = readFileSync(openapiPath, "utf-8");
    res.type("text/yaml").send(contents);
  } catch {
    res.status(503).json({
      error: { code: "INTERNAL_ERROR", message: "OpenAPI document unavailable" },
    });
  }
});
