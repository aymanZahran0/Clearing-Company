import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "@nuqaa-asir/shared";
import type { CreatePricingRuleInput, UpdatePricingRuleInput } from "./schema.js";

export function listRulesForService(serviceId: string) {
  return prisma.pricingRule.findMany({
    where: { serviceId, active: true },
    orderBy: { priority: "asc" },
  });
}

export function createRule(input: CreatePricingRuleInput) {
  return prisma.pricingRule.create({
    data: { ...input, conditionsJson: input.conditionsJson as Prisma.InputJsonValue },
  });
}

export async function updateRule(id: string, input: UpdatePricingRuleInput) {
  const existing = await prisma.pricingRule.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "Pricing rule not found");
  }
  return prisma.pricingRule.update({
    where: { id },
    data: {
      ...input,
      conditionsJson: input.conditionsJson
        ? (input.conditionsJson as Prisma.InputJsonValue)
        : undefined,
    },
  });
}

export async function disableRule(id: string) {
  const existing = await prisma.pricingRule.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "Pricing rule not found");
  }
  await prisma.pricingRule.update({ where: { id }, data: { active: false } });
}
