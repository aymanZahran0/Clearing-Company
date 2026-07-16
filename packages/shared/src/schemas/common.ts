import { z } from "zod";

// Saudi mobile numbers: accepts 05XXXXXXXX or +9665XXXXXXXX / 9665XXXXXXXX,
// with optional spaces/dashes between digits (e.g. "05 3333 3333") — must
// stay tolerant of the same formats `normalizeSaudiPhone` in
// apps/api/src/lib/phoneNormalization.ts accepts, since that function is
// what actually normalizes whatever passes this shape check.
export const saudiPhoneSchema = z
  .string()
  .trim()
  .refine((value) => /^(?:\+?966|0)?5\d{8}$/.test(value.replace(/[\s-]/g, "")), {
    message: "Enter a valid Saudi mobile number (e.g. 05XXXXXXXX or +9665XXXXXXXX)",
  });

export const uuidSchema = z.string().uuid();

// Money is always stored/transmitted as an integer count of minor units
// (halalas) to avoid floating-point rounding errors in pricing (FR-024).
export const moneySchema = z.number().int().nonnegative();

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const consentSchema = z.literal(true, {
  errorMap: () => ({ message: "Consent must be accepted" }),
});
