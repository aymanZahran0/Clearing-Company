import { prisma } from "../../lib/prisma.js";
import { ApiError } from "@nuqaa-asir/shared";
import type { CreateServiceAreaInput, UpdateServiceAreaInput } from "./schema.js";

// FR-012: only active areas are bookable.
export function listAreas(includeInactive: boolean) {
  return prisma.serviceArea.findMany({
    where: includeInactive ? undefined : { active: true },
  });
}

export function createArea(input: CreateServiceAreaInput) {
  return prisma.serviceArea.create({ data: { ...input, nameEn: input.nameAr } });
}

export async function updateArea(id: string, input: UpdateServiceAreaInput) {
  const existing = await prisma.serviceArea.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "Service area not found");
  }
  return prisma.serviceArea.update({
    where: { id },
    data: { ...input, ...(input.nameAr ? { nameEn: input.nameAr } : {}) },
  });
}

export async function disableArea(id: string) {
  const existing = await prisma.serviceArea.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "Service area not found");
  }
  await prisma.serviceArea.update({ where: { id }, data: { active: false } });
}

export async function deleteArea(id: string) {
  const existing = await prisma.serviceArea.findUnique({
    where: { id },
    include: { _count: { select: { addresses: true } } },
  });
  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "Service area not found");
  }
  if (existing._count.addresses > 0) {
    throw new ApiError(409, "CONFLICT", "Cannot delete an area that has customer addresses");
  }
  await prisma.serviceArea.delete({ where: { id } });
}
