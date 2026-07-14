import { prisma } from "../../lib/prisma.js";
import { ApiError } from "@nuqaa-asir/shared";
import type { CreateServiceAreaInput, UpdateServiceAreaInput } from "./schema.js";

// FR-012: only active areas are bookable.
export function listActiveAreas() {
  return prisma.serviceArea.findMany({ where: { active: true } });
}

export function createArea(input: CreateServiceAreaInput) {
  return prisma.serviceArea.create({ data: input });
}

export async function updateArea(id: string, input: UpdateServiceAreaInput) {
  const existing = await prisma.serviceArea.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "Service area not found");
  }
  return prisma.serviceArea.update({ where: { id }, data: input });
}
