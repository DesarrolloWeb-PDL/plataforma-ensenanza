import { describe, expect, it } from "vitest";

import { assignmentSchema, attendanceSchema, gradeSchema, lessonProgressSchema, lessonSchema, levelCompletionSchema, levelSchema, liveClassSchema, submissionSchema, trackSchema } from "./types";

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

describe("shared assignment schemas", () => {
  it("validates an assignment", () => {
    const result = assignmentSchema.safeParse({
      id: "123e4567-e89b-12d3-a456-426614174000",
      classId: "123e4567-e89b-12d3-a456-426614174001",
      lessonId: null,
      type: "code",
      title: "Tarea",
      instructionsMd: "",
      dueAt: null,
      maxScore: 100,
      rubricId: null,
      maxResubmissions: 2,
      status: "draft",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("validates a submission", () => {
    const result = submissionSchema.safeParse({
      id: "123e4567-e89b-12d3-a456-426614174002",
      assignmentId: "123e4567-e89b-12d3-a456-426614174000",
      studentId: "123e4567-e89b-12d3-a456-426614174001",
      version: 1,
      status: "submitted",
      payload: { type: "code", content: "print()" },
      submittedAt: "2026-01-01T00:00:00.000Z",
      idempotencyKey: "key-1",
    });
    expect(result.success).toBe(true);
  });

  it("validates a grade", () => {
    const result = gradeSchema.safeParse({
      id: "123e4567-e89b-12d3-a456-426614174003",
      submissionId: "123e4567-e89b-12d3-a456-426614174002",
      score: 90,
      feedback: "Bien",
      gradedBy: "123e4567-e89b-12d3-a456-426614174001",
      gradedAt: "2026-01-01T00:00:00.000Z",
      rubricScores: { c1: 10 },
    });
    expect(result.success).toBe(true);
  });
});

describe("shared live class schemas", () => {
  it("validates a live class", () => {
    const result = liveClassSchema.safeParse({
      id: "123e4567-e89b-12d3-a456-426614174000",
      classId: "123e4567-e89b-12d3-a456-426614174001",
      trackId: "123e4567-e89b-12d3-a456-426614174002",
      title: "Clase en vivo",
      meetingUrl: "https://meet.example.com/abc",
      provider: "external-link",
      scheduledAt: "2026-01-01T00:00:00.000Z",
      durationMin: 60,
      recordingUrl: null,
    });
    expect(result.success).toBe(true);
  });

  it("validates attendance", () => {
    const result = attendanceSchema.safeParse({
      liveClassId: "123e4567-e89b-12d3-a456-426614174000",
      userId: "123e4567-e89b-12d3-a456-426614174001",
      joinedAt: "2026-01-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid live class", () => {
    const result = liveClassSchema.safeParse({ id: "not-uuid", title: "" });
    expect(result.success).toBe(false);
  });
});