import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { StorageAdapter } from "./index.js";

// S3-compatible adapter (works against AWS S3, Cloudflare R2, MinIO, etc.
// via OBJECT_STORAGE_ENDPOINT). URL construction assumes a public bucket
// or CDN in front of it, per research.md R4 — signed-GET URLs are not
// needed since service images are public catalog assets, not customer PII.
export class S3StorageAdapter implements StorageAdapter {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(options: { endpoint?: string; bucket: string; region?: string; publicBaseUrl?: string }) {
    this.bucket = options.bucket;
    this.client = new S3Client({
      endpoint: options.endpoint || undefined,
      region: options.region ?? "auto",
      forcePathStyle: Boolean(options.endpoint),
    });
    this.publicBaseUrl = options.publicBaseUrl ?? options.endpoint ?? "";
  }

  async upload({ key, body, contentType }: { key: string; body: Buffer; contentType: string }) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );
    return { url: `${this.publicBaseUrl.replace(/\/$/, "")}/${this.bucket}/${key}` };
  }

  async delete(key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
