import { describe, expect, it } from "vitest";
import { SMOKE, add } from "./index";

describe("shared smoke", () => {
  it("exports project name", () => {
    expect(SMOKE).toBe("plataforma-ensenanza");
  });

  it("adds numbers", () => {
    expect(add(1, 2)).toBe(3);
  });
});
