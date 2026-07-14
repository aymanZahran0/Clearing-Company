import type { Prisma } from "@prisma/client";
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
