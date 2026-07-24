import path from "node:path";
import { LocalStorageAdapter, S3StorageAdapter, type StorageAdapter } from "./index.js";

let cached: StorageAdapter | null = null;

// Lazily constructed (not at module load / app boot) so the API can still
// start and serve every other route when object storage isn't configured
// in this environment — only the upload endpoint itself fails, with a
// clear error, per research.md R4.
export function getStorageAdapter(): StorageAdapter {
  if (cached) return cached;

  const bucket = process.env.OBJECT_STORAGE_BUCKET;
  const driver =
    process.env.OBJECT_STORAGE_DRIVER ??
    (process.env.OBJECT_STORAGE_ENDPOINT ||
    process.env.OBJECT_STORAGE_PUBLIC_URL ||
    process.env.AWS_ACCESS_KEY_ID
      ? "s3"
      : "local");

  if (driver === "local") {
    cached = new LocalStorageAdapter(
      getLocalUploadRoot(),
      process.env.API_PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? "4000"}`
    );
    return cached;
  }

  if (!bucket) throw new Error("OBJECT_STORAGE_BUCKET is required for the S3 storage driver");

  cached = new S3StorageAdapter({
    endpoint: process.env.OBJECT_STORAGE_ENDPOINT,
    bucket,
    publicBaseUrl: process.env.OBJECT_STORAGE_PUBLIC_URL,
  });
  return cached;
}

export function getLocalUploadRoot() {
  return path.resolve(process.env.LOCAL_UPLOAD_DIR ?? path.join(process.cwd(), "uploads"));
}
