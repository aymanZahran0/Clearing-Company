import { z } from "zod";

// The file itself arrives via multer (multipart/form-data), not this
// schema — these are the accompanying text fields sent alongside it.
export const uploadServiceImageMetaSchema = z.object({
  altTextAr: z.string().trim().max(300).optional(),
  altTextEn: z.string().trim().max(300).optional(),
  sortOrder: z.coerce.number().int().optional(),
});
export type UploadServiceImageMeta = z.infer<typeof uploadServiceImageMetaSchema>;
