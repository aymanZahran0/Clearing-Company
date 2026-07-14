import { prisma } from "../../lib/prisma.js";

export async function listAuditLogs(filters: { entityType?: string; page: number; pageSize: number }) {
  const where = filters.entityType ? { entityType: filters.entityType } : {};
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { items, total, page: filters.page, pageSize: filters.pageSize };
}
