import { ApiError } from "@nuqaa-asir/shared";
import { prisma } from "../../lib/prisma.js";
import type { UpsertContentBlockInput, UpsertFaqItemInput } from "./schema.js";

export function listActiveContentBlocks() {
  return prisma.websiteContentBlock.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
}

export function listAllContentBlocks() {
  return prisma.websiteContentBlock.findMany({ orderBy: { sortOrder: "asc" } });
}

export function upsertContentBlock(input: UpsertContentBlockInput) {
  return prisma.websiteContentBlock.upsert({
    where: { key: input.key },
    create: input,
    update: input,
  });
}

export async function deleteContentBlock(id: string) {
  const block = await prisma.websiteContentBlock.findUnique({ where: { id } });
  if (!block) {
    throw new ApiError(404, "NOT_FOUND", "Content block not found");
  }
  await prisma.websiteContentBlock.delete({ where: { id } });
}

export function listActiveFaqs() {
  return prisma.faqItem.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
}

export function listAllFaqs() {
  return prisma.faqItem.findMany({ orderBy: { sortOrder: "asc" } });
}

export function createFaqItem(input: UpsertFaqItemInput) {
  return prisma.faqItem.create({ data: input });
}

export async function updateFaqItem(id: string, input: Partial<UpsertFaqItemInput>) {
  const item = await prisma.faqItem.findUnique({ where: { id } });
  if (!item) {
    throw new ApiError(404, "NOT_FOUND", "FAQ item not found");
  }
  return prisma.faqItem.update({ where: { id }, data: input });
}

export async function deleteFaqItem(id: string) {
  const item = await prisma.faqItem.findUnique({ where: { id } });
  if (!item) {
    throw new ApiError(404, "NOT_FOUND", "FAQ item not found");
  }
  await prisma.faqItem.delete({ where: { id } });
}
