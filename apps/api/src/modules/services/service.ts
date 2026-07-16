import { prisma } from "../../lib/prisma.js";
import { ApiError } from "@nuqaa-asir/shared";
import type { CreateServiceInput, UpdateServiceInput } from "./schema.js";

export function listServices(categoryId?: string, includeInactive = false) {
  return prisma.service.findMany({
    where: { ...(includeInactive ? {} : { active: true }), ...(categoryId ? { categoryId } : {}) },
    include: { images: true, addOns: includeInactive ? true : { where: { active: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function getServiceBySlug(slug: string) {
  const service = await prisma.service.findFirst({
    where: { slug, active: true },
    include: { images: true, addOns: { where: { active: true } } },
  });
  if (!service) {
    throw new ApiError(404, "NOT_FOUND", "Service not found");
  }
  return service;
}

export async function getServiceById(id: string) {
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) {
    throw new ApiError(404, "NOT_FOUND", "Service not found");
  }
  return service;
}

export async function createService(input: CreateServiceInput) {
  const existing = await prisma.service.findUnique({ where: { slug: input.slug } });
  if (existing) {
    throw new ApiError(409, "CONFLICT", "A service with this slug already exists");
  }
  return prisma.service.create({ data: input });
}

export async function updateService(id: string, input: UpdateServiceInput) {
  await getServiceById(id);
  return prisma.service.update({ where: { id }, data: input });
}

export async function disableService(id: string) {
  await getServiceById(id);
  await prisma.service.update({ where: { id }, data: { active: false } });
}
