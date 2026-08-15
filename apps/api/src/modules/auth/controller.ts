import type { Request, Response } from "express";
import * as authService from "./service.js";
import { prisma } from "../../lib/prisma.js";

const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function refreshCookieOptions() {
  const production = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: production,
    // The production web and API projects use distinct vercel.app origins.
    // Cross-site refresh cookies therefore require SameSite=None + Secure.
    sameSite: (production ? "none" : "strict") as "none" | "strict",
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    path: "/api/v1/auth",
  };
}

function toPublicUser(user: {
  id: string;
  email: string | null;
  phoneNormalized: string | null;
  role: string;
  status: string;
  fullName: string;
}) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phoneNormalized,
    role: user.role,
    status: user.status,
  };
}

export async function registerHandler(req: Request, res: Response) {
  const { accessToken, refreshToken, user } = await authService.register(req.body);
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
  res.status(201).json({ accessToken, user: toPublicUser(user) });
}

export async function loginHandler(req: Request, res: Response) {
  const { accessToken, refreshToken, user } = await authService.login(req.body);
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
  res.status(200).json({ accessToken, user: toPublicUser(user) });
}

export async function refreshHandler(req: Request, res: Response) {
  const existingRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
  const { accessToken, refreshToken, user } = await authService.refresh(existingRefreshToken);
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
  res.status(200).json({ accessToken, user: toPublicUser(user) });
}

export async function logoutHandler(req: Request, res: Response) {
  await authService.logout(req.cookies?.[REFRESH_COOKIE_NAME]);
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
  res.status(204).send();
}

export async function forgotPasswordHandler(req: Request, res: Response) {
  await authService.forgotPassword(req.body);
  res.status(202).json({ message: "If an account exists, reset instructions were sent." });
}

export async function resetPasswordHandler(req: Request, res: Response) {
  await authService.resetPassword(req.body);
  res.status(200).json({ message: "Password updated" });
}

export async function changePasswordHandler(req: Request, res: Response) {
  await authService.changePassword(req.user!.id, req.body);
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
  res.status(200).json({ message: "Password updated" });
}

export async function meHandler(req: Request, res: Response) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
  res.status(200).json(toPublicUser(user));
}
