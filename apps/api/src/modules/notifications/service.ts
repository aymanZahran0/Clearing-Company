import { prisma } from "../../lib/prisma.js";
import type { UpsertTemplateInput } from "./schema.js";

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
