import { describe, expect, it } from "vitest";
import * as schema from "./schema";

describe("db schema", () => {
  it("exports tables", () => {
    expect(Object.keys(schema).length).toBeGreaterThan(0);
  });
});