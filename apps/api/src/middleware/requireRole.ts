import type { NextFunction, Request, Response } from "express";
import { ApiError } from "@nuqaa-asir/shared";
import type { Role } from "@nuqaa-asir/shared";

/**
 * FR-003: enforces the CUSTOMER/ADMIN boundary server-side on every
 * request, not just by hiding UI. Must run after `authenticate`.
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(403, "FORBIDDEN", "You do not have permission to perform this action");
    }
    next();
  };
}
