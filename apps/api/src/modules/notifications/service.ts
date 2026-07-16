import { prisma } from "../../lib/prisma.js";
import type { UpsertTemplateInput } from "./schema.js";

export interface NotifyInput {
  channel: "EMAIL" | "SMS" | "WHATSAPP";
  templateKey: string;
  recipient: string;
  payload: Record<string, unknown>;
  bookingId?: string;
  customerId?: string;
}

// FR-067/FR-070: always writes a NotificationLog row and never throws, so a
// notification failure never blocks the caller's action. No real SMTP/SMS
// provider is wired yet — every attempt is logged as PENDING until a
// provider adapter is plugged into this function (mirrors the
// lib/storage/factory.ts adapter-factory pattern for when that lands).
export async function notify(input: NotifyInput): Promise<void> {
  try {
    await prisma.notificationLog.create({
      data: {
        bookingId: input.bookingId,
        customerId: input.customerId,
        channel: input.channel,
        templateKey: input.templateKey,
        recipient: input.recipient,
        payloadSnapshot: input.payload as object,
        status: "PENDING",
      },
    });
  } catch {
    // Best-effort: notification failures must never block the caller.
  }
}

export function listTemplates() {
  return prisma.notificationTemplate.findMany({ orderBy: { key: "asc" } });
}

export function upsertTemplate(input: UpsertTemplateInput) {
  return prisma.notificationTemplate.upsert({
    where: { key: input.key },
    create: input,
    update: input,
  });
}

export async function listLogs(filters: { status?: string; page: number; pageSize: number }) {
  const where = filters.status ? { status: filters.status as never } : {};
  const [items, total] = await Promise.all([
    prisma.notificationLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.notificationLog.count({ where }),
  ]);
  return { items, total, page: filters.page, pageSize: filters.pageSize };
}

// T178: a customer's own notification history (FR-069 read scope) —
// scoped by `customerId`, never exposing other customers' logs.
export function listLogsForCustomer(customerId: string) {
  return prisma.notificationLog.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
  });
}
