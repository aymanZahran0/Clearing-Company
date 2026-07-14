import { ApiError } from "@nuqaa-asir/shared";
import { S3StorageAdapter, type StorageAdapter } from "./index.js";

let cached: StorageAdapter | null = null;

// Lazily constructed (not at module load / app boot) so the API can still
// start and serve every other route when object storage isn't configured
// in this environment — only the upload endpoint itself fails, with a
// clear error, per research.md R4.
export function getStorageAdapter(): StorageAdapter {
  if (cached) return cached;

  const bucket = process.env.OBJECT_STORAGE_BUCKET;
  if (!bucket) {
    throw new ApiError(
      503,
      "INTERNAL_ERROR",
      "Object storage is not configured (OBJECT_STORAGE_BUCKET missing)"
    );
  }

  cached = new S3StorageAdapter({
    endpoint: process.env.OBJECT_STORAGE_ENDPOINT,
    bucket,
    publicBaseUrl: process.env.OBJECT_STORAGE_PUBLIC_URL,
  });
  return cached;
}
