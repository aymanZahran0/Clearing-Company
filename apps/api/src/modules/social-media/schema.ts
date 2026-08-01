import { z } from "zod";

export const socialMediaPlatformSchema = z.enum(["FACEBOOK", "INSTAGRAM", "TIKTOK", "X", "WHATSAPP"]);

export const upsertSocialMediaLinkSchema = z.object({
  platform: socialMediaPlatformSchema,
  url: z.string().trim().url(),
  active: z.boolean().default(false),
});
export type UpsertSocialMediaLinkInput = z.infer<typeof upsertSocialMediaLinkSchema>;
