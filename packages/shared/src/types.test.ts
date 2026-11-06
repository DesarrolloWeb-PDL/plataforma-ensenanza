import { describe, expect, it } from "vitest";

import { lessonProgressSchema, lessonSchema, levelCompletionSchema, levelSchema, trackSchema } from "./types";

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

  it("validates lesson progress", () => {
    const result = lessonProgressSchema.safeParse({
      id: "123e4567-e89b-12d3-a456-426614174002",
      studentId: "123e4567-e89b-12d3-a456-426614174000",
      lessonId: "123e4567-e89b-12d3-a456-426614174001",
      completedAt: "2026-01-01T00:00:00.000Z",
      xpAwarded: 10,
    });
    expect(result.success).toBe(true);
  });

  it("validates level completion", () => {
    const result = levelCompletionSchema.safeParse({
      id: "123e4567-e89b-12d3-a456-426614174002",
      studentId: "123e4567-e89b-12d3-a456-426614174000",
      levelId: "123e4567-e89b-12d3-a456-426614174001",
      status: "completed",
      projectSubmissionId: null,
      completedAt: "2026-01-01T00:00:00.000Z",
      approvedBy: null,
    });
    expect(result.success).toBe(true);
  });
});