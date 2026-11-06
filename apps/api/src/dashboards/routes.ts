import type { FastifyInstance } from "fastify";
import { eq, inArray } from "drizzle-orm";

import {
  assignments,
  classes,
  enrollments,
  lessonProgress,
  levelCompletions,
  parentLinks,
  rubrics,
  submissions,
  tracks,
  users,
} from "@plataforma/db";
import {
  ERROR_CODES,
  type GradingQueueItem,
  type ParentSummary,
  type RosterEntry,
  type Role,
  type User,
  type LessonProgress as LessonProgressType,
  type LevelCompletion as LevelCompletionType,
} from "@plataforma/shared";
import { AuthContext, requireAuth, sendError } from "../auth/rbac";
import { idParamSchema } from "../tracks/schemas";

type Ctx = AuthContext;

function isTeacherOrAdmin(role?: string): boolean {
  return role === "teacher" || role === "admin";
}

function toUser(row: typeof users.$inferSelect): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as Role,
    locale: row.locale,
    birthDate: row.birthDate ?? null,
    consentStatus: row.consentStatus,
    parentUserId: row.parentUserId ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

function toLessonProgress(row: typeof lessonProgress.$inferSelect): LessonProgressType {
  return {
    id: row.id,
    studentId: row.studentId,
    lessonId: row.lessonId,
    completedAt: row.completedAt.toISOString(),
    xpAwarded: row.xpAwarded,
  };
}

function toLevelCompletion(row: typeof levelCompletions.$inferSelect): LevelCompletionType {
  return {
    id: row.id,
    studentId: row.studentId,
    levelId: row.levelId,
    status: row.status,
    projectSubmissionId: row.projectSubmissionId ?? null,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    approvedBy: row.approvedBy ?? null,
  };
}

function toRubric(row: typeof rubrics.$inferSelect) {
  return {
    id: row.id,
    ownerId: row.ownerId,
    title: row.title,
    criteria: row.criteria,
    totalPoints: row.totalPoints,
    reusable: row.reusable,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function registerDashboardRoutes(app: FastifyInstance, ctx: Ctx): Promise<void> {
  const prefix = "/api/v1";

  // Teacher: classes owned by teacher
  app.get(`${prefix}/teacher/classes`, async (request, reply) => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;
    if (!isTeacherOrAdmin(request.user?.role)) {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "Permisos insuficientes");
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no esta configurada");
      return;
    }
    const db = ctx.db;
    const userId = request.user!.sub;
    const role = request.user!.role;

    const classRows =
      role === "admin"
        ? await db.select().from(classes)
        : await db.select().from(classes).where(eq(classes.teacherId, userId));

    const trackIds = [...new Set(classRows.map((c) => c.trackId))];
    const trackRows = trackIds.length ? await db.select().from(tracks).where(inArray(tracks.id, trackIds)) : [];
    const trackMap = new Map(trackRows.map((t) => [t.id, t]));

    const data = classRows.map((c) => ({
      id: c.id,
      teacherId: c.teacherId,
      trackId: c.trackId,
      trackName: trackMap.get(c.trackId)?.name ?? null,
      title: c.title,
      createdAt: c.createdAt.toISOString(),
    }));
    reply.send({ data });
  });

  // Teacher: roster for a class
  app.get<{ Params: { id: string } }>(`${prefix}/teacher/classes/:id/roster`, async (request, reply) => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;
    if (!isTeacherOrAdmin(request.user?.role)) {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "Permisos insuficientes");
      return;
    }
    const parsed = idParamSchema.safeParse(request.params);
    if (!parsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Parametro invalido", parsed.error.flatten());
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no esta configurada");
      return;
    }
    const db = ctx.db;
    const userId = request.user!.sub;
    const role = request.user!.role;

    const classRows = await db.select().from(classes).where(eq(classes.id, parsed.data.id)).limit(1);
    const cls = classRows[0];
    if (!cls) {
      sendError(reply, 404, ERROR_CODES.NOT_FOUND, "Clase no encontrada");
      return;
    }
    if (role !== "admin" && cls.teacherId !== userId) {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "Permisos insuficientes");
      return;
    }

    const enrollRows = await db.select().from(enrollments).where(eq(enrollments.classId, cls.id));
    const userIds = enrollRows.map((e) => e.userId);
    const userRows = userIds.length ? await db.select().from(users).where(inArray(users.id, userIds)) : [];
    const userMap = new Map(userRows.map((u) => [u.id, u]));

    const data: RosterEntry[] = enrollRows.map((e) => {
      const u = userMap.get(e.userId);
      return {
        userId: e.userId,
        name: u?.name ?? "",
        email: u?.email ?? "",
        role: e.role,
        enrolledAt: e.createdAt.toISOString(),
      };
    });
    reply.send({ data });
  });

  // Teacher: progress for students in a class
  app.get<{ Params: { id: string } }>(`${prefix}/teacher/classes/:id/progress`, async (request, reply) => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;
    if (!isTeacherOrAdmin(request.user?.role)) {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "Permisos insuficientes");
      return;
    }
    const parsed = idParamSchema.safeParse(request.params);
    if (!parsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Parametro invalido", parsed.error.flatten());
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no esta configurada");
      return;
    }
    const db = ctx.db;
    const userId = request.user!.sub;
    const role = request.user!.role;

    const classRows = await db.select().from(classes).where(eq(classes.id, parsed.data.id)).limit(1);
    const cls = classRows[0];
    if (!cls) {
      sendError(reply, 404, ERROR_CODES.NOT_FOUND, "Clase no encontrada");
      return;
    }
    if (role !== "admin" && cls.teacherId !== userId) {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "Permisos insuficientes");
      return;
    }

    const enrollRows = await db.select().from(enrollments).where(eq(enrollments.classId, cls.id));
    const studentIds = enrollRows.map((e) => e.userId);

    const data = [];
    for (const sid of studentIds) {
      const uRows = await db.select().from(users).where(eq(users.id, sid)).limit(1);
      const u = uRows[0];
      const lpRows = await db.select().from(lessonProgress).where(eq(lessonProgress.studentId, sid));
      const lcRows = await db.select().from(levelCompletions).where(eq(levelCompletions.studentId, sid));
      data.push({
        studentId: sid,
        studentName: u?.name ?? "",
        lessonsCompleted: lpRows.length,
        levelsCompleted: lcRows.filter((r) => r.status === "completed").length,
        lessons: lpRows.map(toLessonProgress),
        levels: lcRows.map(toLevelCompletion),
      });
    }
    reply.send({ data });
  });

  // Teacher: grading queue (pending submissions)
  app.get(`${prefix}/teacher/grading-queue`, async (request, reply) => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;
    if (!isTeacherOrAdmin(request.user?.role)) {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "Permisos insuficientes");
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no esta configurada");
      return;
    }
    const db = ctx.db;
    const userId = request.user!.sub;
    const role = request.user!.role;

    const classRows =
      role === "admin" ? await db.select().from(classes) : await db.select().from(classes).where(eq(classes.teacherId, userId));
    const classIds = classRows.map((c) => c.id);
    if (classIds.length === 0) {
      reply.send({ data: [] });
      return;
    }

    const assignmentRows = await db.select().from(assignments).where(inArray(assignments.classId, classIds));
    const assignmentIds = assignmentRows.map((a) => a.id);
    const assignmentMap = new Map(assignmentRows.map((a) => [a.id, a]));

    if (assignmentIds.length === 0) {
      reply.send({ data: [] });
      return;
    }

    const submissionRows = await db.select().from(submissions).where(inArray(submissions.assignmentId, assignmentIds));
    const pending = submissionRows.filter((s) => s.status !== "graded");

    const studentIds = [...new Set(pending.map((s) => s.studentId))];
    const studentRows = studentIds.length ? await db.select().from(users).where(inArray(users.id, studentIds)) : [];
    const studentMap = new Map(studentRows.map((u) => [u.id, u]));

    const data: GradingQueueItem[] = pending.map((s) => ({
      submissionId: s.id,
      assignmentId: s.assignmentId,
      assignmentTitle: assignmentMap.get(s.assignmentId)?.title ?? "",
      studentId: s.studentId,
      studentName: studentMap.get(s.studentId)?.name ?? "",
      submittedAt: s.submittedAt.toISOString(),
      status: s.status,
    }));
    reply.send({ data });
  });

  // Teacher: rubrics owned
  app.get(`${prefix}/teacher/rubrics`, async (request, reply) => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;
    if (!isTeacherOrAdmin(request.user?.role)) {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "Permisos insuficientes");
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no esta configurada");
      return;
    }
    const db = ctx.db;
    const userId = request.user!.sub;
    const role = request.user!.role;
    const rows =
      role === "admin" ? await db.select().from(rubrics) : await db.select().from(rubrics).where(eq(rubrics.ownerId, userId));
    reply.send({ data: rows.map(toRubric) });
  });

  // Parent: children
  app.get(`${prefix}/parent/children`, async (request, reply) => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;
    if (request.user?.role !== "parent" && request.user?.role !== "admin") {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "Permisos insuficientes");
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no esta configurada");
      return;
    }
    const db = ctx.db;
    const userId = request.user!.sub;
    const role = request.user!.role;

    let childIds: string[] = [];
    if (role === "admin") {
      const rows = await db.select().from(users).where(eq(users.role, "student"));
      childIds = rows.map((u) => u.id);
    } else {
      const direct = await db.select().from(users).where(eq(users.parentUserId, userId));
      childIds.push(...direct.map((u) => u.id));
      const links = await db.select().from(parentLinks).where(eq(parentLinks.parentId, userId));
      const activeLinks = links.filter((l) => l.revokedAt === null);
      childIds.push(...activeLinks.map((l) => l.childId));
      childIds = [...new Set(childIds)];
    }

    const childRows = childIds.length ? await db.select().from(users).where(inArray(users.id, childIds)) : [];
    reply.send({ data: childRows.map(toUser) });
  });

  // Parent: child progress
  app.get<{ Params: { id: string } }>(`${prefix}/parent/children/:id/progress`, async (request, reply) => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;
    if (request.user?.role !== "parent" && request.user?.role !== "admin") {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "Permisos insuficientes");
      return;
    }
    const parsed = idParamSchema.safeParse(request.params);
    if (!parsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Parametro invalido", parsed.error.flatten());
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no esta configurada");
      return;
    }
    const db = ctx.db;
    const parentId = request.user!.sub;
    const role = request.user!.role;
    const childId = parsed.data.id;

    const childRows = await db.select().from(users).where(eq(users.id, childId)).limit(1);
    const child = childRows[0];
    if (!child) {
      sendError(reply, 404, ERROR_CODES.NOT_FOUND, "Hijo no encontrado");
      return;
    }

    if (role !== "admin") {
      const allowed = child.parentUserId === parentId;
      let linkAllowed = false;
      if (!allowed) {
        const links = await db.select().from(parentLinks).where(eq(parentLinks.childId, childId));
        linkAllowed = links.some((l) => l.parentId === parentId && l.revokedAt === null);
      }
      if (!allowed && !linkAllowed) {
        sendError(reply, 403, ERROR_CODES.FORBIDDEN, "Permisos insuficientes");
        return;
      }
    }

    const lpRows = await db.select().from(lessonProgress).where(eq(lessonProgress.studentId, childId));
    const lcRows = await db.select().from(levelCompletions).where(eq(levelCompletions.studentId, childId));

    const summary: ParentSummary = {
      childId,
      childName: child.name,
      completedLessons: lpRows.length,
      completedLevels: lcRows.filter((r) => r.status === "completed").length,
    };

    reply.send({
      data: {
        ...summary,
        lessons: lpRows.map(toLessonProgress),
        levels: lcRows.map(toLevelCompletion),
      },
    });
  });
}