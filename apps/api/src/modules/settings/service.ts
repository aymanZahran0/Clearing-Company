import type { Prisma } from "@prisma/client";
import { ApiError } from "@nuqaa-asir/shared";
import { prisma } from "../../lib/prisma.js";
import type { UpdateSettingInput } from "./schema.js";

export function listSettings() {
  return prisma.systemSetting.findMany({ orderBy: { key: "asc" } });
}

export function upsertSetting(input: UpdateSettingInput, updatedByUserId: string) {
  return prisma.systemSetting.upsert({
    where: { key: input.key },
    create: {
      key: input.key,
      value: input.value as Prisma.InputJsonValue,
      description: input.description,
      updatedByUserId,
    },
    update: {
      value: input.value as Prisma.InputJsonValue,
      description: input.description,
      updatedByUserId,
    },
  });
}

export async function deleteSetting(key: string) {
  const existing = await prisma.systemSetting.findUnique({ where: { key } });
  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "Setting not found");
  }
  await prisma.systemSetting.delete({ where: { key } });
}
