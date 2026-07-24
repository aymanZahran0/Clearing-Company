import { prisma } from "../../lib/prisma.js";
import { ApiError } from "@nuqaa-asir/shared";
import { v4 as uuidv4 } from "uuid";
import type { CreateServiceCategoryInput, UpdateServiceCategoryInput } from "./schema.js";

// FR-009: soft-disable only, never deletes historical data.
export function listCategories(includeInactive: boolean) {
  return prisma.serviceCategory.findMany({
    where: includeInactive ? undefined : { active: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function createCategory(input: CreateServiceCategoryInput) {
  return prisma.serviceCategory.create({
    data: { ...input, nameEn: input.nameAr, slug: uuidv4() },
  });
}

export async function updateCategory(id: string, input: UpdateServiceCategoryInput) {
  const existing = await prisma.serviceCategory.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "Service category not found");
  }
  return prisma.serviceCategory.update({
    where: { id },
    data: { ...input, ...(input.nameAr ? { nameEn: input.nameAr } : {}) },
  });
}

export async function disableCategory(id: string) {
  const existing = await prisma.serviceCategory.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "Service category not found");
  }
  await prisma.serviceCategory.update({ where: { id }, data: { active: false } });
}

export async function deleteCategory(id: string) {
  const existing = await prisma.serviceCategory.findUnique({
    where: { id },
    include: { _count: { select: { services: true } } },
  });
  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "Service category not found");
  }
  if (existing._count.services > 0) {
    throw new ApiError(409, "CONFLICT", "Cannot delete a category that contains services");
  }
  await prisma.serviceCategory.delete({ where: { id } });
}
