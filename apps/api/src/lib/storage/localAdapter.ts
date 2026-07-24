import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StorageAdapter } from "./index.js";

export class LocalStorageAdapter implements StorageAdapter {
  constructor(
    private readonly rootDirectory: string,
    private readonly publicBaseUrl: string
  ) {}

  async upload({ key, body }: { key: string; body: Buffer; contentType: string }) {
    const target = this.resolveKey(key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, body);
    return {
      url: `${this.publicBaseUrl.replace(/\/$/, "")}/uploads/${key.replaceAll("\\", "/")}`,
    };
  }

  async delete(key: string) {
    await rm(this.resolveKey(key), { force: true });
  }

  private resolveKey(key: string) {
    const normalizedKey = key.replaceAll("\\", "/").replace(/^\/+/, "");
    const target = path.resolve(this.rootDirectory, normalizedKey);
    const root = `${path.resolve(this.rootDirectory)}${path.sep}`;
    if (!target.startsWith(root)) {
      throw new Error("Invalid local storage key");
    }
    return target;
  }
}
