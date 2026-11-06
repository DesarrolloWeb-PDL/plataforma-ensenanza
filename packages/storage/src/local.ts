import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import type { SignedDownloadUrl, SignedUploadUrl, StorageProvider } from "./types";

export class LocalStorageProvider implements StorageProvider {
  constructor(private baseDir: string) {}

  private pathFor(key: string): string {
    return resolve(this.baseDir, key);
  }

  async upload(key: string, body: Uint8Array | Buffer, contentType?: string): Promise<void> {
    void contentType;
    const filePath = this.pathFor(key);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, body);
  }

  async download(key: string): Promise<Uint8Array> {
    const data = await readFile(this.pathFor(key));
    return new Uint8Array(data);
  }

  async getSignedUploadUrl(key: string, contentType?: string, expiresInSeconds = 900): Promise<SignedUploadUrl> {
    void contentType;
    return { url: `file://${this.pathFor(key)}`, key, expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString() };
  }

  async getSignedDownloadUrl(key: string, expiresInSeconds = 900): Promise<SignedDownloadUrl> {
    return { url: `file://${this.pathFor(key)}`, expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString() };
  }

  async delete(key: string): Promise<void> {
    await rm(this.pathFor(key), { force: true });
  }

  async exists(key: string): Promise<boolean> {
    try {
      await readFile(this.pathFor(key));
      return true;
    } catch {
      return false;
    }
  }
}