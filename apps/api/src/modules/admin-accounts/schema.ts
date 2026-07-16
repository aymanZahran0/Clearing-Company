import { z } from "zod";

export const inviteAdminSchema = z.object({
  fullName: z.string().trim().min(2).max(200),
  email: z.string().trim().email(),
});
export type InviteAdminInput = z.infer<typeof inviteAdminSchema>;

export const createAdminSchema = z.object({
  fullName: z.string().trim().min(2).max(200),
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
});
export type CreateAdminInput = z.infer<typeof createAdminSchema>;
