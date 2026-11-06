import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import type { SignedDownloadUrl, SignedUploadUrl, StorageProvider } from "./types";

export class R2StorageProvider implements StorageProvider {
  constructor(
    private client: S3Client,
    private bucket: string,
  ) {}

  async upload(key: string, body: Uint8Array | Buffer, contentType?: string): Promise<void> {
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }));
  }

  async download(key: string): Promise<Uint8Array> {
    const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const bytes = await result.Body?.transformToByteArray();
    if (!bytes) throw new Error("Empty object body");
    return bytes;
  }

  async getSignedUploadUrl(key: string, contentType?: string, expiresInSeconds = 900): Promise<SignedUploadUrl> {
    const url = await getSignedUrl(this.client, new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType }), {
      expiresIn: expiresInSeconds,
    });
    return { url, key, expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString() };
  }

  async getSignedDownloadUrl(key: string, expiresInSeconds = 900): Promise<SignedDownloadUrl> {
    const url = await getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: expiresInSeconds,
    });
    return { url, expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString() };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    } catch {
      return false;
    }
  }
}