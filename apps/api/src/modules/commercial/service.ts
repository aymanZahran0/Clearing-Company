import { ApiError } from "@nuqaa-asir/shared";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type {
  CreateCommercialAccountInput,
  CreateContractInput,
} from "./schema.js";

export function createCommercialAccount(input: CreateCommercialAccountInput) {
  return prisma.commercialAccount.create({ data: input });
}

export function listCommercialAccounts() {
  return prisma.commercialAccount.findMany({
    orderBy: { companyName: "asc" },
    include: { locations: true, contracts: true },
  });
}

export async function getCommercialAccount(id: string) {
  const account = await prisma.commercialAccount.findUnique({
    where: { id },
    include: { locations: true, contracts: true },
  });
  if (!account) {
    throw new ApiError(404, "NOT_FOUND", "Commercial account not found");
  }
  return account;
}

export async function updateCommercialAccount(id: string, input: Partial<CreateCommercialAccountInput>) {
  await getCommercialAccount(id);
  return prisma.commercialAccount.update({ where: { id }, data: input });
}

export async function addCommercialLocation(
  commercialAccountId: string,
  input: { addressId: string; label?: string }
) {
  await getCommercialAccount(commercialAccountId);
  return prisma.commercialLocation.create({
    data: { commercialAccountId, addressId: input.addressId, label: input.label },
  });
}

export async function createContract(commercialAccountId: string, input: CreateContractInput) {
  await getCommercialAccount(commercialAccountId);
  return prisma.contract.create({
    data: {
      commercialAccountId,
      startDate: input.startDate,
      endDate: input.endDate,
      pricingTermsJson: input.pricingTerms as Prisma.InputJsonValue,
      documentReference: input.documentReference,
    },
  });
}

export async function updateContract(
  id: string,
  input: Partial<CreateContractInput> & { status?: "ACTIVE" | "EXPIRED" | "TERMINATED" }
) {
  const contract = await prisma.contract.findUnique({ where: { id } });
  if (!contract) {
    throw new ApiError(404, "NOT_FOUND", "Contract not found");
  }
  return prisma.contract.update({
    where: { id },
    data: {
      startDate: input.startDate,
      endDate: input.endDate,
      pricingTermsJson: input.pricingTerms as Prisma.InputJsonValue | undefined,
      documentReference: input.documentReference,
      status: input.status,
    },
  });
}
