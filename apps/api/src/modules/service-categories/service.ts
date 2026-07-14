import { prisma } from "../../lib/prisma.js";
import { ApiError } from "@nuqaa-asir/shared";
import type { CreateServiceCategoryInput, UpdateServiceCategoryInput } from "./schema.js";

// FR-009: soft-disable only, never deletes historical data.
export function listActiveCategories() {
  return prisma.serviceCategory.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
}

export function listAllCategories() {
  return prisma.serviceCategory.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function createCategory(input: CreateServiceCategoryInput) {
  const existing = await prisma.serviceCategory.findUnique({ where: { slug: input.slug } });
  if (existing) {
    throw new ApiError(409, "CONFLICT", "A category with this slug already exists");
  }
  return prisma.serviceCategory.create({ data: input });
}

export async function updateCategory(id: string, input: UpdateServiceCategoryInput) {
  const existing = await prisma.serviceCategory.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "Service category not found");
  }
  return prisma.serviceCategory.update({ where: { id }, data: input });
}

export async function disableCategory(id: string) {
  const existing = await prisma.serviceCategory.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "Service category not found");
  }
  await prisma.serviceCategory.update({ where: { id }, data: { active: false } });
}
