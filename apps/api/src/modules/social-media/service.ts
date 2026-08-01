import { prisma } from "../../lib/prisma.js";
import type { UpsertSocialMediaLinkInput } from "./schema.js";

export function listActiveSocialMediaLinks() {
  return prisma.socialMediaLink.findMany({ where: { active: true }, orderBy: { platform: "asc" } });
}

export function listAllSocialMediaLinks() {
  return prisma.socialMediaLink.findMany({ orderBy: { platform: "asc" } });
}

export function upsertSocialMediaLink(input: UpsertSocialMediaLinkInput) {
  return prisma.socialMediaLink.upsert({
    where: { platform: input.platform },
    create: input,
    update: { url: input.url, active: input.active },
  });
}
