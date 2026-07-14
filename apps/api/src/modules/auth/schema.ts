import { z } from "zod";
import { saudiPhoneSchema } from "@nuqaa-asir/shared";

export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(200),
  phone: saudiPhoneSchema,
  email: z.string().trim().email().optional(),
  password: z.string().min(8).max(200),
  marketingConsent: z.boolean().default(false),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  identifier: z.string().trim().min(3),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  identifier: z.string().trim().min(3),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(200),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
