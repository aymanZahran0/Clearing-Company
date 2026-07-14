import { z } from "zod";

export const addressInputSchema = z.object({
  label: z.string().trim().max(100).optional(),
  city: z.string().trim().min(1).max(200),
  neighborhood: z.string().trim().min(1).max(200),
  street: z.string().trim().max(300).optional(),
  buildingNumber: z.string().trim().max(50).optional(),
  unitNumber: z.string().trim().max(50).optional(),
  landmark: z.string().trim().max(300).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  mapUrl: z.string().trim().url().optional(),
  serviceAreaId: z.string().uuid(),
  isDefault: z.boolean().default(false),
});
export type AddressInput = z.infer<typeof addressInputSchema>;

export const addressUpdateSchema = addressInputSchema.partial();
