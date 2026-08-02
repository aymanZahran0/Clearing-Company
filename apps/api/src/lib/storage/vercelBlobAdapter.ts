import { del, put } from "@vercel/blob";
import type { StorageAdapter } from "./index.js";

/** Persistent public storage for production service-catalog images on Vercel. */
export class VercelBlobStorageAdapter implements StorageAdapter {
  async upload({ key, body, contentType }: { key: string; body: Buffer; contentType: string }) {
    const blob = await put(key, body, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });

    return { url: blob.url };
  }

  async delete(key: string) {
    await del(key);
  }
}
