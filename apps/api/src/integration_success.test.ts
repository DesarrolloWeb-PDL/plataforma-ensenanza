/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("drizzle-orm", () => ({
  eq: (col: any, val: any) => (row: any) => row?.[String(col?.name ?? col).replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase())] === val,
  and: (...conds: any[]) => (row: any) => conds.every((c) => (typeof c === "function" ? c(row) : true)),
  inArray: (col: any, arr: any[]) => (row: any) => arr.includes(row?.[String(col?.name ?? col).replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase())]),
  sql: (strings: any, ...values: any[]) => ({ __sql: true, strings, values }),
}));

vi.mock("./gamification/service", () => ({
  awardXp: vi.fn(),
  updateStreak: vi.fn(),
  awardBadges: vi.fn(),
}));

import { buildApp } from "./app";
import { loadEnv } from "./env";
import { createFakeDb } from "./fakeDb";
import { tracks, levels, lessons, classes, enrollments } from "@plataforma/db";

describe("api integration success paths", () => {
  let app: any;
  let db: any;

  beforeEach(async () => {
    db = createFakeDb();
    const env = loadEnv({ NODE_ENV: "test" });
    const built = await buildApp(env);
    app = built.app;
    built.context.db = db;
  });

  it("tracks and lessons read + progress complete + assignment submit", async () => {
    // seed track/level/lesson
    const [trackRow] = await db.insert(tracks).values({ slug: "bloques", name: "Bloques", ageBand: "6-12", order: 1 }).returning();
    const [levelRow] = await db.insert(levels).values({ trackId: trackRow.id, order: 1, title: "L1", projectTitle: "P" }).returning();
    const [lessonRow] = await db.insert(lessons).values({ trackId: trackRow.id, levelId: levelRow.id, order: 1, title: "Les", mdxRef: "x" }).returning();

    // teacher register
    await app.inject({ method: "POST", url: "/api/v1/auth/register", payload: { email: "t@b.com", password: "longenough", name: "Teacher", role: "teacher" } });
    const tLogin = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email: "t@b.com", password: "longenough" } });
    const teacherToken = tLogin.json().data.tokens.accessToken;
    const teacherId = tLogin.json().data.user.id;

    // class + enrollment
    const [classRow] = await db.insert(classes).values({ teacherId, trackId: trackRow.id, title: "C1" }).returning();
    await db.insert(enrollments).values({ classId: classRow.id, userId: "student-placeholder", role: "student" });

    // student register
    await app.inject({ method: "POST", url: "/api/v1/auth/register", payload: { email: "st@b.com", password: "longenough", name: "Student" } });
    const sLogin = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email: "st@b.com", password: "longenough" } });
    const studentToken = sLogin.json().data.tokens.accessToken;
    const studentId = sLogin.json().data.user.id;

    // fix enrollment userId
    await db.update(enrollments).set({ userId: studentId }).where(() => true);

    // tracks read endpoints
    let res = await app.inject({ method: "GET", url: "/api/v1/tracks" });
    expect(res.statusCode).toBe(200);
    res = await app.inject({ method: "GET", url: `/api/v1/tracks/${trackRow.slug}` });
    expect(res.statusCode).toBe(200);
    res = await app.inject({ method: "GET", url: `/api/v1/tracks/${trackRow.slug}/levels` });
    expect(res.statusCode).toBe(200);
    res = await app.inject({ method: "GET", url: `/api/v1/levels/${levelRow.id}` });
    expect(res.statusCode).toBe(200);
    res = await app.inject({ method: "GET", url: `/api/v1/levels/${levelRow.id}/lessons` });
    expect(res.statusCode).toBe(200);
    res = await app.inject({ method: "GET", url: `/api/v1/lessons/${lessonRow.id}` });
    expect(res.statusCode).toBe(200);

    // progress complete success
    res = await app.inject({ method: "POST", url: `/api/v1/lessons/${lessonRow.id}/complete`, headers: { authorization: `Bearer ${studentToken}` } });
    expect(res.statusCode).toBe(200);

    // level complete success
    res = await app.inject({ method: "POST", url: `/api/v1/levels/${levelRow.id}/complete`, headers: { authorization: `Bearer ${studentToken}` } });
    expect(res.statusCode).toBe(200);

    // me progress
    res = await app.inject({ method: "GET", url: "/api/v1/me/progress", headers: { authorization: `Bearer ${studentToken}` } });
    expect(res.statusCode).toBe(200);

    // teacher creates assignment
    const createRes = await app.inject({
      method: "POST",
      url: "/api/v1/assignments",
      headers: { authorization: `Bearer ${teacherToken}` },
      payload: { classId: classRow.id, title: "A1", instructionsMd: "", type: "code" },
    });
    expect(createRes.statusCode).toBe(201);
    const assignmentId = createRes.json().data.id;

    // student submits
    const submitRes = await app.inject({
      method: "POST",
      url: `/api/v1/assignments/${assignmentId}/submit`,
      headers: { authorization: `Bearer ${studentToken}` },
      payload: { type: "code", content: "print()" },
    });
    expect(submitRes.statusCode).toBe(201);

    // auth me
    const meRes = await app.inject({ method: "GET", url: "/api/v1/me", headers: { authorization: `Bearer ${studentToken}` } });
    expect(meRes.statusCode).toBe(200);

    // tracks progress endpoint
    const tpRes = await app.inject({ method: "GET", url: `/api/v1/tracks/${trackRow.slug}/progress`, headers: { authorization: `Bearer ${studentToken}` } });
    expect(tpRes.statusCode).toBe(200);
  });
});