import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/jwt.js";

/**
 * Like `authenticate`, but never throws — used on endpoints that are
 * public but behave slightly differently for a logged-in Customer (e.g.
 * POST /quotes/estimate attaching customerId when available).
 */
export function tryAuthenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      const payload = verifyAccessToken(header.slice("Bearer ".length));
      req.user = { id: payload.sub, role: payload.role };
    } catch {
      // Ignore invalid/expired token on a public route — request proceeds unauthenticated.
    }
  }
  next();
}
