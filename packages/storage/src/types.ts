export interface SignedUploadUrl {
  url: string;
  key: string;
  expiresAt: string;
}

export interface SignedDownloadUrl {
  url: string;
  expiresAt: string;
}

export interface StorageProvider {
  upload(key: string, body: Uint8Array | Buffer, contentType?: string): Promise<void>;
  download(key: string): Promise<Uint8Array>;
  getSignedUploadUrl(key: string, contentType?: string, expiresInSeconds?: number): Promise<SignedUploadUrl>;
  getSignedDownloadUrl(key: string, expiresInSeconds?: number): Promise<SignedDownloadUrl>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

export interface StorageConfig {
  accountId?: string | undefined;
  accessKeyId?: string | undefined;
  secretAccessKey?: string | undefined;
  bucket?: string | undefined;
  forceLocal?: boolean | undefined;
  localBaseDir?: string | undefined;
}