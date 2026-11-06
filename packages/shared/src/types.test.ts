import { describe, expect, it } from "vitest";

import { lessonSchema, levelSchema, trackSchema } from "./types";

describe("shared track/level/lesson schemas", () => {
  it("validates a track", () => {
    const result = trackSchema.safeParse({
      id: "123e4567-e89b-12d3-a456-426614174000",
      slug: "bloques",
      name: "Bloques",
      ageBand: "6-12",
      order: 1,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid lesson", () => {
    const result = lessonSchema.safeParse({ id: "not-uuid", title: "" });
    expect(result.success).toBe(false);
  });

  it("validates a level", () => {
    const result = levelSchema.safeParse({
      id: "123e4567-e89b-12d3-a456-426614174001",
      trackId: "123e4567-e89b-12d3-a456-426614174000",
      order: 0,
      title: "L0",
      projectTitle: "Proj",
    });
    expect(result.success).toBe(true);
  });
});