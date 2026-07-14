import type { NextFunction, Request, Response } from "express";
import { ApiError } from "@nuqaa-asir/shared";
import type { Role } from "@nuqaa-asir/shared";
import { verifyAccessToken } from "../lib/jwt.js";

export interface AuthenticatedUser {
  id: string;
  role: Role;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Verifies the Bearer access token and attaches req.user. Does not touch
 * the database (access tokens are short-lived, FR-002/research.md R3) —
 * refresh-token rotation/revocation is checked at /auth/refresh instead.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new ApiError(401, "UNAUTHORIZED", "Missing or invalid Authorization header");
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid or expired access token");
  }
}
