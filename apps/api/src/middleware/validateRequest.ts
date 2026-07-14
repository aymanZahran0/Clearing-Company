import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

interface ValidationTargets {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Validates req.body/query/params against Zod schemas shared with the
 * frontend via packages/shared, then replaces them with the parsed
 * (coerced/defaulted) values. Throws ZodError on failure, caught by
 * errorHandler and turned into a 422 VALIDATION_ERROR response.
 */
export function validateRequest({ body, query, params }: ValidationTargets) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (body) req.body = body.parse(req.body);
    if (query) req.query = query.parse(req.query) as typeof req.query;
    if (params) req.params = params.parse(req.params) as typeof req.params;
    next();
  };
}
