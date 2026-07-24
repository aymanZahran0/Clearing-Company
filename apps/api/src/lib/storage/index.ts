// Object-storage adapter interface (research.md R4). A concrete
// implementation is chosen at startup based on env vars, so callers never
// depend on a specific provider's SDK directly.
export interface StorageAdapter {
  upload(input: { key: string; body: Buffer; contentType: string }): Promise<{ url: string }>;
  delete(key: string): Promise<void>;
}

export { S3StorageAdapter } from "./s3Adapter.js";
export { LocalStorageAdapter } from "./localAdapter.js";
