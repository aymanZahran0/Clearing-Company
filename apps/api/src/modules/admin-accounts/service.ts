import bcrypt from "bcrypt";
import { randomBytes, createHash } from "node:crypto";
import { ApiError } from "@nuqaa-asir/shared";
import { prisma } from "../../lib/prisma.js";
import { recordAuditEntry } from "../../middleware/auditLogger.js";
import { notify } from "../notifications/service.js";
import type { CreateAdminInput, InviteAdminInput } from "./schema.js";

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

interface ActorContext {
  actorUserId: string;
  ipAddress?: string;
  userAgent?: string;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Never return passwordHash/refreshTokenVersion to the client — these
// endpoints otherwise return the raw Prisma User row, which would leak a
// bcrypt hash (even null-vs-populated is more than callers need) over the API.
function toPublicAdmin(user: {
  id: string;
  fullName: string;
  email: string | null;
  status: string;
  lastLoginAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

export function listAdmins() {
  return prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, fullName: true, email: true, status: true, lastLoginAt: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
}

async function issueResetToken(userId: string): Promise<string> {
  const rawToken = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });
  return rawToken;
}

// FR-032/Edge Cases: reject duplicate invite, explain account already exists.
export async function inviteAdmin(input: InviteAdminInput, actor: ActorContext) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ApiError(409, "CONFLICT", "An account with this email already exists");
  }

  const user = await prisma.user.create({
    data: { fullName: input.fullName, email: input.email, role: "ADMIN", status: "INVITED" },
  });

  const rawToken = await issueResetToken(user.id);
  await notify({
    channel: "EMAIL",
    templateKey: "ADMIN_INVITE",
    recipient: input.email,
    payload: { resetToken: rawToken, fullName: input.fullName },
  });

  await recordAuditEntry({
    actorUserId: actor.actorUserId,
    action: "ADMIN_INVITED",
    entityType: "User",
    entityId: user.id,
    afterSnapshot: { email: user.email, status: user.status },
    ipAddress: actor.ipAddress,
    userAgent: actor.userAgent,
  });

  return toPublicAdmin(user);
}

// FR-032: direct-creation fallback, no email dependency.
export async function createAdminDirectly(input: CreateAdminInput, actor: ActorContext) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ApiError(409, "CONFLICT", "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: { fullName: input.fullName, email: input.email, passwordHash, role: "ADMIN", status: "ACTIVE" },
  });

  await recordAuditEntry({
    actorUserId: actor.actorUserId,
    action: "ADMIN_CREATED",
    entityType: "User",
    entityId: user.id,
    afterSnapshot: { email: user.email, status: user.status },
    ipAddress: actor.ipAddress,
    userAgent: actor.userAgent,
  });

  return toPublicAdmin(user);
}

async function getActiveAdmin(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role !== "ADMIN") {
    throw new ApiError(404, "NOT_FOUND", "Admin account not found");
  }
  return user;
}

// FR-037: the core safety guarantee — never allow the last active Admin to
// be suspended. countActiveAdmins() runs inside the same transaction as the
// status update, closing the check-then-write race.
export async function suspendAdmin(id: string, actor: ActorContext) {
  await getActiveAdmin(id);

  await prisma.$transaction(async (tx) => {
    const target = await tx.user.findUniqueOrThrow({ where: { id } });
    if (target.status !== "ACTIVE") {
      // Already suspended/invited — nothing to guard, proceed idempotently
      // only if it's a no-op state change is meaningless; require ACTIVE.
      throw new ApiError(409, "CONFLICT", "This Admin account is not currently active");
    }

    const activeCount = await tx.user.count({ where: { role: "ADMIN", status: "ACTIVE" } });
    if (activeCount <= 1) {
      throw new ApiError(409, "CONFLICT", "Cannot suspend the last active Admin account");
    }

    await tx.user.update({
      where: { id },
      data: { status: "SUSPENDED", refreshTokenVersion: { increment: 1 } },
    });
  });

  await recordAuditEntry({
    actorUserId: actor.actorUserId,
    action: "ADMIN_SUSPENDED",
    entityType: "User",
    entityId: id,
    ipAddress: actor.ipAddress,
    userAgent: actor.userAgent,
  });

  return toPublicAdmin(await getActiveAdmin(id));
}

export async function reactivateAdmin(id: string, actor: ActorContext) {
  const target = await getActiveAdmin(id);
  if (target.status !== "SUSPENDED") {
    throw new ApiError(404, "NOT_FOUND", "This Admin account is not currently suspended");
  }

  const updated = await prisma.user.update({ where: { id }, data: { status: "ACTIVE" } });

  await recordAuditEntry({
    actorUserId: actor.actorUserId,
    action: "ADMIN_REACTIVATED",
    entityType: "User",
    entityId: id,
    ipAddress: actor.ipAddress,
    userAgent: actor.userAgent,
  });

  return toPublicAdmin(updated);
}

// FR-035: Admin-mediated reset of *another* Admin's credential — distinct
// from the self-service forgotPassword flow (FR-036), reused unchanged.
export async function resetAdminCredential(id: string, actor: ActorContext) {
  const target = await getActiveAdmin(id);

  await prisma.$transaction([
    prisma.user.update({
      where: { id },
      data: { passwordHash: null, refreshTokenVersion: { increment: 1 } },
    }),
  ]);

  const rawToken = await issueResetToken(id);
  if (target.email) {
    await notify({
      channel: "EMAIL",
      templateKey: "ADMIN_CREDENTIAL_RESET",
      recipient: target.email,
      payload: { resetToken: rawToken, fullName: target.fullName },
    });
  }

  await recordAuditEntry({
    actorUserId: actor.actorUserId,
    action: "ADMIN_CREDENTIAL_RESET",
    entityType: "User",
    entityId: id,
    ipAddress: actor.ipAddress,
    userAgent: actor.userAgent,
  });

  return { success: true };
}
