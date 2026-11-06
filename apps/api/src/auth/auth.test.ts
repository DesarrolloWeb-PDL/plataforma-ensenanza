import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./password";
import { signJwt, verifyJwt } from "./jwt";

describe("auth utils", () => {
  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("secret123");
    expect(await verifyPassword("secret123", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("signs and verifies JWTs", () => {
    const secret = "test-access-secret";
    const token = signJwt(
      { sub: "user-1", role: "student", locale: "es", type: "access" },
      secret,
      60,
    );
    const payload = verifyJwt(token, secret);
    expect(payload?.sub).toBe("user-1");
    expect(payload?.role).toBe("student");
    expect(verifyJwt(token, "wrong-secret")).toBeNull();
  });
});