import { z } from "zod";
import { moneySchema } from "@nuqaa-asir/shared";

export const paymentInputSchema = z.object({
  method: z.enum(["CASH", "BANK_TRANSFER", "POS", "COMPLIMENTARY", "OTHER"]),
  status: z
    .enum(["PAID", "PARTIALLY_PAID", "REFUNDED_RECORDED", "WAIVED"])
    .default("PAID"),
  amount: moneySchema,
  reference: z.string().trim().max(200).optional(),
  paidAt: z.coerce.date().optional(),
});
export type PaymentInput = z.infer<typeof paymentInputSchema>;
