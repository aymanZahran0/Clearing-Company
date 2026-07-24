import { prisma } from "../../lib/prisma.js";
import { ApiError } from "@nuqaa-asir/shared";
import { v4 as uuidv4 } from "uuid";
import type { CreateServiceInput, UpdateServiceInput } from "./schema.js";

export function listServices(categoryId?: string, includeInactive = false) {
  return prisma.service.findMany({
    where: { ...(includeInactive ? {} : { active: true }), ...(categoryId ? { categoryId } : {}) },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      addOns: includeInactive ? true : { where: { active: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getServiceBySlug(slug: string) {
  const service = await prisma.service.findFirst({
    where: { slug, active: true },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      addOns: { where: { active: true } },
    },
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
  return prisma.service.create({ data: { ...input, slug: uuidv4() } });
}

export async function updateService(id: string, input: UpdateServiceInput) {
  await getServiceById(id);
  return prisma.service.update({ where: { id }, data: input });
}

export async function disableService(id: string) {
  await getServiceById(id);
  await prisma.service.update({ where: { id }, data: { active: false } });
}

export async function deleteService(id: string) {
  await getServiceById(id);
  const [bookingItems, quotes] = await Promise.all([
    prisma.bookingItem.count({ where: { serviceId: id } }),
    prisma.quote.count({ where: { serviceId: id } }),
  ]);
  if (bookingItems > 0 || quotes > 0) {
    throw new ApiError(409, "CONFLICT", "Cannot delete a service used by bookings or quotes");
  }
  await prisma.service.delete({ where: { id } });
}
