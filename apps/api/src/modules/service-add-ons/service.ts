import { prisma } from "../../lib/prisma.js";
import { ApiError } from "@nuqaa-asir/shared";
import type { CreateServiceAddOnInput, UpdateServiceAddOnInput } from "./schema.js";

export function listAddOns(serviceId?: string, includeInactive = false) {
  return prisma.serviceAddOn.findMany({
    where: { ...(includeInactive ? {} : { active: true }), ...(serviceId ? { serviceId } : {}) },
  });
}

export function createAddOn(input: CreateServiceAddOnInput) {
  return prisma.serviceAddOn.create({ data: input });
}

export async function updateAddOn(id: string, input: UpdateServiceAddOnInput) {
  const existing = await prisma.serviceAddOn.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "Add-on not found");
  }
  return prisma.serviceAddOn.update({ where: { id }, data: input });
}

export async function disableAddOn(id: string) {
  const existing = await prisma.serviceAddOn.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "Add-on not found");
  }
  await prisma.serviceAddOn.update({ where: { id }, data: { active: false } });
}
