import type { NextFunction, Request, Response } from "express";
import { ApiError } from "@nuqaa-asir/shared";
import type { Role } from "@nuqaa-asir/shared";
import { verifyAccessToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";

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
 * Checks the account's session version so password resets immediately
 * invalidate access tokens as well as refresh tokens.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new ApiError(401, "UNAUTHORIZED", "Missing or invalid Authorization header"));
    return;
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = await verifyActiveAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (error) {
    next(error);
  }
}

export async function verifyActiveAccessToken(token: string) {
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid or expired access token");
  }
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { refreshTokenVersion: true },
  });
  if (!user || user.refreshTokenVersion !== payload.tokenVersion) {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid or expired access token");
  }
  return payload;
}
