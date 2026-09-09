import type { NextFunction, Request, Response } from "express";
import { ApiError } from "@nuqaa-asir/shared";
import { verifyActiveAccessToken } from "./authenticate.js";

/**
 * Like `authenticate`, but never throws — used on endpoints that are
 * public but behave slightly differently for a logged-in Customer (e.g.
 * POST /quotes/estimate attaching customerId when available).
 */
export async function tryAuthenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      const payload = await verifyActiveAccessToken(header.slice("Bearer ".length));
      req.user = { id: payload.sub, role: payload.role };
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) {
        next(error);
        return;
      }
      // Ignore invalid/expired token on a public route — request proceeds unauthenticated.
    }
  }
  next();
}
