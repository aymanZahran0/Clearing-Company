import { ApiError } from "@nuqaa-asir/shared";
import { prisma } from "../../lib/prisma.js";
import type { AddressInput } from "./schema.js";

export function listOwnAddresses(customerId: string) {
  return prisma.customerAddress.findMany({
    where: { customerId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
}

export async function createOwnAddress(customerId: string, input: AddressInput) {
  const area = await prisma.serviceArea.findUnique({ where: { id: input.serviceAreaId } });
  if (!area?.active) {
    throw new ApiError(409, "SERVICE_AREA_UNAVAILABLE", "This area is not currently serviced");
  }
  return prisma.customerAddress.create({ data: { ...input, customerId } });
}

async function assertOwnership(customerId: string, addressId: string) {
  const address = await prisma.customerAddress.findUnique({ where: { id: addressId } });
  if (!address || address.customerId !== customerId) {
    throw new ApiError(404, "NOT_FOUND", "Address not found");
  }
  return address;
}

export async function updateOwnAddress(
  customerId: string,
  addressId: string,
  input: Partial<AddressInput>
) {
  await assertOwnership(customerId, addressId);
  return prisma.customerAddress.update({ where: { id: addressId }, data: input });
}

export async function deleteOwnAddress(customerId: string, addressId: string) {
  await assertOwnership(customerId, addressId);
  await prisma.customerAddress.delete({ where: { id: addressId } });
}

export function listAddressesForCustomer(customerId: string) {
  return prisma.customerAddress.findMany({ where: { customerId } });
}

// FR-018: Admin creates an address on behalf of a phone/WhatsApp customer.
export async function createAddressForCustomer(customerId: string, input: AddressInput) {
  const area = await prisma.serviceArea.findUnique({ where: { id: input.serviceAreaId } });
  if (!area?.active) {
    throw new ApiError(409, "SERVICE_AREA_UNAVAILABLE", "This area is not currently serviced");
  }
  return prisma.customerAddress.create({ data: { ...input, customerId } });
}
