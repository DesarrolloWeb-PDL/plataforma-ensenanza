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
import { tracks, levels, lessons, classes, assignments } from "@plataforma/db";

describe("api integration (fake db)", () => {
  let app: any;
  let context: any;
  let db: any;

  beforeEach(async () => {
    db = createFakeDb();
    const env = loadEnv({ NODE_ENV: "test" });
    const built = await buildApp(env);
    app = built.app;
    context = built.context;
    context.db = db;
  });

  it("health endpoint", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
  });

  it("auth register and login", async () => {
    const reg = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: { email: "a@b.com", password: "longenough", name: "Alumno" },
    });
    expect(reg.statusCode).toBe(201);
    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "a@b.com", password: "longenough" },
    });
    expect(login.statusCode).toBe(200);
    const body = login.json();
    expect(body.data.tokens.accessToken).toBeTruthy();
  });

  it("tracks read returns empty list", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/tracks" });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().data)).toBe(true);
  });

  it("tracks read with seeded data", async () => {
    await db.insert(tracks).values({ slug: "bloques", name: "Bloques", ageBand: "6-12", order: 1 });
    const res = await app.inject({ method: "GET", url: "/api/v1/tracks" });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.length).toBe(1);
  });

  it("progress complete requires enrollment -> 403 when not enrolled", async () => {
    const [trackRow] = await db.insert(tracks).values({ slug: "bloques", name: "Bloques", ageBand: "6-12", order: 1 }).returning();
    const [levelRow] = await db.insert(levels).values({ trackId: trackRow.id, order: 1, title: "L1", projectTitle: "P" }).returning();
    const [lessonRow] = await db.insert(lessons).values({ trackId: trackRow.id, levelId: levelRow.id, order: 1, title: "Les", mdxRef: "x" }).returning();

    await app.inject({ method: "POST", url: "/api/v1/auth/register", payload: { email: "s@b.com", password: "longenough", name: "Student" } });
    const login = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email: "s@b.com", password: "longenough" } });
    const token = login.json().data.tokens.accessToken;

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/lessons/${lessonRow.id}/complete`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it("assignments submit requires enrollment -> 403 when not enrolled", async () => {
    const [trackRow] = await db.insert(tracks).values({ slug: "bloques", name: "Bloques", ageBand: "6-12", order: 1 }).returning();
    const [classRow] = await db.insert(classes).values({ teacherId: "teacher-1", trackId: trackRow.id, title: "C1" }).returning();
    const [assignmentRow] = await db.insert(assignments).values({ classId: classRow.id, title: "A1", instructionsMd: "", createdBy: "teacher-1" }).returning();

    await app.inject({ method: "POST", url: "/api/v1/auth/register", payload: { email: "s2@b.com", password: "longenough", name: "Student2" } });
    const login = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email: "s2@b.com", password: "longenough" } });
    const token = login.json().data.tokens.accessToken;

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/assignments/${assignmentRow.id}/submit`,
      headers: { authorization: `Bearer ${token}` },
      payload: { type: "code", content: "print()" },
    });
    expect(res.statusCode).toBe(403);
  });

  it("ownership: student cannot create assignment (403)", async () => {
    await app.inject({ method: "POST", url: "/api/v1/auth/register", payload: { email: "stu@b.com", password: "longenough", name: "Stu", role: "student" } });
    const login = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email: "stu@b.com", password: "longenough" } });
    const token = login.json().data.tokens.accessToken;
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/assignments",
      headers: { authorization: `Bearer ${token}` },
      payload: { classId: "00000000-0000-0000-0000-000000000000", title: "X" },
    });
    expect(res.statusCode).toBe(403);
  });
});