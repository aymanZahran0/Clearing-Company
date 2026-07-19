import bcrypt from "bcrypt";
import { randomBytes, createHash, randomUUID } from "node:crypto";
import { ApiError } from "@nuqaa-asir/shared";
import { prisma } from "../../lib/prisma.js";
import { normalizeSaudiPhone } from "../../lib/phoneNormalization.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt.js";
import type { ForgotPasswordInput, LoginInput, RegisterInput, ResetPasswordInput } from "./schema.js";

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function issueTokenPair(user: { id: string; role: "CUSTOMER" | "ADMIN"; refreshTokenVersion: number }) {
  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role,
    tokenVersion: user.refreshTokenVersion,
  });

  const refreshTokenId = randomUUID();
  const refreshToken = signRefreshToken({ sub: user.id, jti: refreshTokenId });

  await prisma.refreshToken.create({
    data: {
      id: refreshTokenId,
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  return { accessToken, refreshToken };
}

export async function register(input: RegisterInput) {
  const phoneNormalized = normalizeSaudiPhone(input.phone);

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ phoneNormalized }, input.email ? { email: input.email } : undefined].filter(
        Boolean
      ) as Array<{ phoneNormalized: string } | { email: string }>,
    },
  });
  if (existing) {
    throw new ApiError(409, "CONFLICT", "An account with this phone or email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      fullName: input.fullName,
      phoneNormalized,
      email: input.email,
      passwordHash,
      role: "CUSTOMER",
      status: "ACTIVE",
      customerProfile: {
        create: {
          marketingConsent: input.marketingConsent,
        },
      },
    },
  });

  const tokens = await issueTokenPair(user);
  return { user, ...tokens };
}

export async function login(input: LoginInput) {
  const isEmail = input.identifier.includes("@");
  const user = await prisma.user.findFirst({
    where: isEmail
      ? { email: input.identifier.trim().toLowerCase() }
      : { phoneNormalized: safeNormalize(input.identifier) },
  });

  if (!user?.passwordHash) {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid credentials");
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid credentials");
  }

  if (user.status === "SUSPENDED") {
    // FR-015: stable, non-sensitive code — never reveals the suspension
    // reason (that lives only in the AuditLog entry Admin can see).
    throw new ApiError(401, "ACCOUNT_SUSPENDED", "This account has been suspended");
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const tokens = await issueTokenPair(user);
  return { user, ...tokens };
}

function safeNormalize(identifier: string): string {
  try {
    return normalizeSaudiPhone(identifier);
  } catch {
    return identifier; // let the lookup miss and fall through to 401
  }
}

export async function refresh(rawRefreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid or expired refresh token");
  }

  const stored = await prisma.refreshToken.findUnique({ where: { id: payload.jti } });
  if (!stored || stored.revokedAt || stored.tokenHash !== hashToken(rawRefreshToken)) {
    throw new ApiError(401, "UNAUTHORIZED", "Refresh token has been revoked");
  }
  if (stored.expiresAt < new Date()) {
    throw new ApiError(401, "UNAUTHORIZED", "Refresh token has expired");
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: stored.userId } });

  // FR-015: a Customer suspended after this refresh token was issued must
  // be rejected here too, not just at login.
  if (user.status === "SUSPENDED") {
    throw new ApiError(401, "ACCOUNT_SUSPENDED", "This account has been suspended");
  }

  // Rotation-on-use: revoke the old refresh token, issue a new pair.
  const tokens = await issueTokenPair(user);
  const newTokenId = extractJti(tokens.refreshToken);
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date(), replacedByTokenId: newTokenId },
  });

  return { user, ...tokens };
}

function extractJti(refreshToken: string) {
  return verifyRefreshToken(refreshToken).jti;
}

export async function logout(rawRefreshToken: string | undefined) {
  if (!rawRefreshToken) return;
  try {
    const payload = verifyRefreshToken(rawRefreshToken);
    await prisma.refreshToken.updateMany({
      where: { id: payload.jti, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  } catch {
    // Already invalid/expired — logout is idempotent, nothing to revoke.
  }
}

export async function forgotPassword(input: ForgotPasswordInput) {
  const isEmail = input.identifier.includes("@");
  const user = await prisma.user.findFirst({
    where: isEmail
      ? { email: input.identifier.trim().toLowerCase() }
      : { phoneNormalized: safeNormalize(input.identifier) },
  });

  // Always behave the same way regardless of whether the account exists,
  // to avoid account enumeration via response timing/shape.
  if (!user) return;

  const rawToken = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  // TODO(notifications): send `rawToken` via the notification module once
  // it exists (Phase 3+). For now the token is created but not dispatched.
}

export async function resetPassword(input: ResetPasswordInput) {
  const tokenHash = hashToken(input.token);
  const record = await prisma.passwordResetToken.findFirst({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
  });

  if (!record) {
    throw new ApiError(400, "VALIDATION_ERROR", "Reset token is invalid or has expired");
  }

  const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: {
        passwordHash,
        refreshTokenVersion: { increment: 1 }, // invalidates all outstanding sessions
      },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.refreshToken.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
}
