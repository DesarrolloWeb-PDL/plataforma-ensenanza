import { S3Client } from "@aws-sdk/client-s3";

import { LocalStorageProvider } from "./local";
import { R2StorageProvider } from "./r2";
import type { StorageConfig, StorageProvider } from "./types";

export function createStorageProvider(config: StorageConfig): StorageProvider {
  const hasR2 =
    !config.forceLocal &&
    !!config.accountId &&
    !!config.accessKeyId &&
    !!config.secretAccessKey &&
    !!config.bucket;

  if (hasR2) {
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId as string,
        secretAccessKey: config.secretAccessKey as string,
      },
    });
    return new R2StorageProvider(client, config.bucket as string);
  }

  return new LocalStorageProvider(config.localBaseDir ?? "./storage");
}