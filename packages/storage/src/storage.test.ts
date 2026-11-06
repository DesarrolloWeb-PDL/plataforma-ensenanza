import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LocalStorageProvider, R2StorageProvider, createStorageProvider } from "./index";

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(async () => "https://signed.example/url"),
}));

describe("createStorageProvider", () => {
  it("falls back to local when R2 config is missing", () => {
    const provider = createStorageProvider({});
    expect(provider).toBeInstanceOf(LocalStorageProvider);
  });

  it("creates R2 provider when all R2 env vars present", () => {
    const provider = createStorageProvider({
      accountId: "acct",
      accessKeyId: "key",
      secretAccessKey: "secret",
      bucket: "bucket",
    });
    expect(provider).toBeInstanceOf(R2StorageProvider);
  });
});

describe("R2StorageProvider (mocked client)", () => {
  const send = vi.fn();

  beforeEach(() => {
    send.mockReset();
  });

  it("uploads object with content type", async () => {
    send.mockResolvedValue({});
    const provider = new R2StorageProvider({ send } as never, "bucket");
    await provider.upload("a/b.txt", new Uint8Array([1, 2]), "text/plain");
    expect(send).toHaveBeenCalledOnce();
    const cmd = send.mock.calls[0]![0] as { input: Record<string, unknown> };
    expect(cmd.input).toMatchObject({ Bucket: "bucket", Key: "a/b.txt", ContentType: "text/plain" });
  });

  it("downloads object bytes", async () => {
    send.mockResolvedValue({ Body: { transformToByteArray: async () => new Uint8Array([9, 8]) } });
    const provider = new R2StorageProvider({ send } as never, "bucket");
    const bytes = await provider.download("k");
    expect(Array.from(bytes)).toEqual([9, 8]);
  });

  it("returns false from exists when head throws", async () => {
    send.mockRejectedValue(new Error("not found"));
    const provider = new R2StorageProvider({ send } as never, "bucket");
    expect(await provider.exists("missing")).toBe(false);
  });

  it("returns signed upload/download urls", async () => {
    const provider = new R2StorageProvider({ send } as never, "bucket");
    const up = await provider.getSignedUploadUrl("k", "text/plain", 60);
    const down = await provider.getSignedDownloadUrl("k", 60);
    expect(up.url).toBe("https://signed.example/url");
    expect(down.url).toBe("https://signed.example/url");
    expect(up.key).toBe("k");
  });
});

describe("LocalStorageProvider", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "storage-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("round-trips upload/download and reports exists", async () => {
    const provider = new LocalStorageProvider(dir);
    await provider.upload("sub/file.bin", new Uint8Array([1, 2, 3]), "application/octet-stream");
    expect(await provider.exists("sub/file.bin")).toBe(true);
    const bytes = await provider.download("sub/file.bin");
    expect(Array.from(bytes)).toEqual([1, 2, 3]);
    await provider.delete("sub/file.bin");
    expect(await provider.exists("sub/file.bin")).toBe(false);
  });
});