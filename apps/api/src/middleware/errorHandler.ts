import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "@nuqaa-asir/shared";
import { randomUUID } from "node:crypto";

/**
 * Centralized error handler producing the ErrorResponse shape from
 * contracts/openapi.yaml. Must be registered last in the middleware chain.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const requestId = (req as Request & { id?: string }).id ?? randomUUID();

  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        fieldErrors: err.fieldErrors,
        requestId,
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(422).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request failed validation",
        fieldErrors: err.flatten().fieldErrors,
        requestId,
      },
    });
    return;
  }

  req.log?.error({ err, requestId }, "Unhandled error");

  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
      requestId,
    },
  });
}
