import type { FastifyInstance } from "fastify";
import { eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { assignments, classes, grades, lessons, submissions } from "@plataforma/db";
import { ERROR_CODES, assignmentCreateSchema, assignmentUpdateSchema, gradeSubmissionSchema, signedUploadSchema, submitAssignmentSchema } from "@plataforma/shared";
import type { StorageProvider } from "@plataforma/storage";

import { AuthContext, requireAuth, sendError } from "../auth/rbac";
import { idParamSchema } from "../tracks/schemas";
import { checkStudentEnrolled, checkTeacherOwnsClass, checkTeacherOwnsAssignment } from "../lib/ownership";

type Ctx = AuthContext & { storage: StorageProvider };

function isTeacherOrAdmin(role?: string): boolean {
  return role === "teacher" || role === "admin";
}

function toAssignment(row: typeof assignments.$inferSelect) {
  return {
    id: row.id,
    classId: row.classId,
    lessonId: row.lessonId ?? null,
    type: row.type,
    title: row.title,
    instructionsMd: row.instructionsMd,
    dueAt: row.dueAt ? row.dueAt.toISOString() : null,
    maxScore: row.maxScore,
    rubricId: row.rubricId ?? null,
    maxResubmissions: row.maxResubmissions,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

function toSubmission(row: typeof submissions.$inferSelect) {
  return {
    id: row.id,
    assignmentId: row.assignmentId,
    studentId: row.studentId,
    version: row.version,
    status: row.status,
    payload: row.payload,
    submittedAt: row.submittedAt.toISOString(),
    idempotencyKey: row.idempotencyKey,
  };
}

function toGrade(row: typeof grades.$inferSelect) {
  return {
    id: row.id,
    submissionId: row.submissionId,
    score: row.score,
    feedback: row.feedback,
    gradedBy: row.gradedBy,
    gradedAt: row.gradedAt.toISOString(),
    rubricScores: row.rubricScores,
  };
}

export async function registerAssignmentsRoutes(app: FastifyInstance, ctx: Ctx): Promise<void> {
  const prefix = "/api/v1";

  app.get(`${prefix}/assignments`, async (request, reply) => {
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no está configurada");
      return;
    }
    const q = request.query as { lessonId?: string; trackId?: string; classId?: string };
    let rows = await ctx.db.select().from(assignments);
    if (q.lessonId) rows = rows.filter((r) => r.lessonId === q.lessonId);
    if (q.classId) rows = rows.filter((r) => r.classId === q.classId);
    if (q.trackId) {
      const trackLessons = await ctx.db.select().from(lessons).where(eq(lessons.trackId, q.trackId));
      const ids = new Set(trackLessons.map((l) => l.id));
      rows = rows.filter((r) => r.lessonId !== null && ids.has(r.lessonId));
    }
    reply.send({ data: rows.map(toAssignment) });
  });

  app.get<{ Params: { id: string } }>(`${prefix}/assignments/:id`, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params);
    if (!parsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Parámetro inválido", parsed.error.flatten());
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no está configurada");
      return;
    }
    const rows = await ctx.db.select().from(assignments).where(eq(assignments.id, parsed.data.id)).limit(1);
    const assignment = rows[0];
    if (!assignment) {
      sendError(reply, 404, ERROR_CODES.NOT_FOUND, "Tarea no encontrada");
      return;
    }
    reply.send({ data: toAssignment(assignment) });
  });

  app.post(`${prefix}/assignments`, async (request, reply) => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;
    if (!isTeacherOrAdmin(request.user?.role)) {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "Permisos insuficientes");
      return;
    }
    const parsed = assignmentCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Datos inválidos", parsed.error.flatten());
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no está configurada");
      return;
    }
    const data = parsed.data;
    const clsRows = await ctx.db.select().from(classes).where(eq(classes.id, data.classId)).limit(1);
    const cls = clsRows[0];
    if (!cls) {
      sendError(reply, 404, ERROR_CODES.NOT_FOUND, "Clase no encontrada");
      return;
    }
    if (!(await checkTeacherOwnsClass(ctx.db, data.classId, request.user!.sub, request.user?.role))) {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "Permisos insuficientes");
      return;
    }
    const [row] = await ctx.db
      .insert(assignments)
      .values({
        classId: data.classId,
        createdBy: request.user!.sub,
        lessonId: data.lessonId ?? null,
        type: data.type ?? "code",
        title: data.title,
        instructionsMd: data.instructionsMd ?? "",
        dueAt: data.dueAt ? new Date(data.dueAt) : null,
        maxScore: data.maxScore ?? 100,
        rubricId: data.rubricId ?? null,
        maxResubmissions: data.maxResubmissions ?? 2,
        status: data.status ?? "draft",
      })
      .returning();
    if (!row) {
      sendError(reply, 500, ERROR_CODES.INTERNAL_ERROR, "No se pudo crear la tarea");
      return;
    }
    reply.code(201).send({ data: toAssignment(row) });
  });

  app.patch<{ Params: { id: string } }>(`${prefix}/assignments/:id`, async (request, reply) => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;
    if (!isTeacherOrAdmin(request.user?.role)) {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "Permisos insuficientes");
      return;
    }
    const paramParsed = idParamSchema.safeParse(request.params);
    if (!paramParsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Parámetro inválido", paramParsed.error.flatten());
      return;
    }
    const bodyParsed = assignmentUpdateSchema.safeParse(request.body);
    if (!bodyParsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Datos inválidos", bodyParsed.error.flatten());
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no está configurada");
      return;
    }
    const existingRows = await ctx.db.select().from(assignments).where(eq(assignments.id, paramParsed.data.id)).limit(1);
    const existing = existingRows[0];
    if (!existing) {
      sendError(reply, 404, ERROR_CODES.NOT_FOUND, "Tarea no encontrada");
      return;
    }
    if (!(await checkTeacherOwnsAssignment(ctx.db, existing.id, request.user!.sub, request.user?.role))) {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "Permisos insuficientes");
      return;
    }
    const data = bodyParsed.data;
    const update: Record<string, unknown> = {};
    if (data.lessonId !== undefined) update.lessonId = data.lessonId;
    if (data.type !== undefined) update.type = data.type;
    if (data.title !== undefined) update.title = data.title;
    if (data.instructionsMd !== undefined) update.instructionsMd = data.instructionsMd;
    if (data.dueAt !== undefined) update.dueAt = data.dueAt ? new Date(data.dueAt) : null;
    if (data.maxScore !== undefined) update.maxScore = data.maxScore;
    if (data.rubricId !== undefined) update.rubricId = data.rubricId;
    if (data.maxResubmissions !== undefined) update.maxResubmissions = data.maxResubmissions;
    if (data.status !== undefined) update.status = data.status;
    if (data.classId !== undefined) update.classId = data.classId;

    const [row] = await ctx.db
      .update(assignments)
      .set(update)
      .where(eq(assignments.id, paramParsed.data.id))
      .returning();
    if (!row) {
      sendError(reply, 404, ERROR_CODES.NOT_FOUND, "Tarea no encontrada");
      return;
    }
    reply.send({ data: toAssignment(row) });
  });

  app.delete<{ Params: { id: string } }>(`${prefix}/assignments/:id`, async (request, reply) => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;
    if (!isTeacherOrAdmin(request.user?.role)) {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "Permisos insuficientes");
      return;
    }
    const parsed = idParamSchema.safeParse(request.params);
    if (!parsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Parámetro inválido", parsed.error.flatten());
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no está configurada");
      return;
    }
    const delRows = await ctx.db.select().from(assignments).where(eq(assignments.id, parsed.data.id)).limit(1);
    const delAssignment = delRows[0];
    if (!delAssignment) {
      sendError(reply, 404, ERROR_CODES.NOT_FOUND, "Tarea no encontrada");
      return;
    }
    if (!(await checkTeacherOwnsAssignment(ctx.db, delAssignment.id, request.user!.sub, request.user?.role))) {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "Permisos insuficientes");
      return;
    }
    await ctx.db.delete(assignments).where(eq(assignments.id, parsed.data.id));
    reply.code(204).send();
  });

  app.post<{ Params: { id: string } }>(`${prefix}/assignments/:id/submit`, async (request, reply) => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;
    if (request.user?.role !== "student") {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "Solo los estudiantes pueden enviar tareas");
      return;
    }
    const paramParsed = idParamSchema.safeParse(request.params);
    if (!paramParsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Parámetro inválido", paramParsed.error.flatten());
      return;
    }
    const bodyParsed = submitAssignmentSchema.safeParse(request.body);
    if (!bodyParsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Datos inválidos", bodyParsed.error.flatten());
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no está configurada");
      return;
    }
    const assignmentRows = await ctx.db.select().from(assignments).where(eq(assignments.id, paramParsed.data.id)).limit(1);
    const assignment = assignmentRows[0];
    if (!assignment) {
      sendError(reply, 404, ERROR_CODES.NOT_FOUND, "Tarea no encontrada");
      return;
    }
    const enrolled = await checkStudentEnrolled(ctx.db, assignment.classId, request.user!.sub, request.user?.role);
    if (!enrolled) {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "Debes estar inscrito en la clase");
      return;
    }

    const idempotencyKey = bodyParsed.data.idempotencyKey ?? randomUUID();
    const existing = await ctx.db.select().from(submissions).where(eq(submissions.idempotencyKey, idempotencyKey)).limit(1);
    if (existing[0]) {
      reply.send({ data: toSubmission(existing[0]) });
      return;
    }

    const prior = await ctx.db
      .select()
      .from(submissions)
      .where(eq(submissions.assignmentId, assignment.id));
    const studentPrior = prior.filter((s) => s.studentId === request.user!.sub);
    if (studentPrior.length > assignment.maxResubmissions) {
      sendError(reply, 409, ERROR_CODES.CONFLICT, "Máximo de reenvíos alcanzado");
      return;
    }
    const version = studentPrior.length + 1;

    const payload = {
      type: bodyParsed.data.type,
      content: bodyParsed.data.content,
      fileKey: bodyParsed.data.fileKey,
      answers: bodyParsed.data.answers,
    };

    const [row] = await ctx.db
      .insert(submissions)
      .values({
        assignmentId: assignment.id,
        studentId: request.user!.sub,
        version,
        status: "submitted",
        payload,
        idempotencyKey,
      })
      .returning();
    if (!row) {
      sendError(reply, 500, ERROR_CODES.INTERNAL_ERROR, "No se pudo registrar el envío");
      return;
    }
    ctx.posthog?.capture({ distinctId: request.user!.sub, event: "assignment_submitted", properties: { assignment_id: assignment.id } });
    reply.code(201).send({ data: toSubmission(row) });
  });

  app.get<{ Params: { id: string } }>(`${prefix}/submissions/:id`, async (request, reply) => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;
    const parsed = idParamSchema.safeParse(request.params);
    if (!parsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Parámetro inválido", parsed.error.flatten());
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no está configurada");
      return;
    }
    const rows = await ctx.db.select().from(submissions).where(eq(submissions.id, parsed.data.id)).limit(1);
    const submission = rows[0];
    if (!submission) {
      sendError(reply, 404, ERROR_CODES.NOT_FOUND, "Envío no encontrado");
      return;
    }
    if (request.user?.role === "student" && submission.studentId !== request.user.sub) {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "Permisos insuficientes");
      return;
    }
    if (request.user?.role !== "student") {
      const owns = await checkTeacherOwnsAssignment(ctx.db, submission.assignmentId, request.user!.sub, request.user?.role);
      if (!owns) {
        sendError(reply, 403, ERROR_CODES.FORBIDDEN, "Permisos insuficientes");
        return;
      }
    }
    const gradeRows = await ctx.db.select().from(grades).where(eq(grades.submissionId, submission.id)).limit(1);
    const grade = gradeRows[0];
    reply.send({ data: { ...toSubmission(submission), grade: grade ? toGrade(grade) : null } });
  });

  app.post<{ Params: { id: string } }>(`${prefix}/submissions/:id/grade`, async (request, reply) => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;
    if (!isTeacherOrAdmin(request.user?.role)) {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "Permisos insuficientes");
      return;
    }
    const paramParsed = idParamSchema.safeParse(request.params);
    if (!paramParsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Parámetro inválido", paramParsed.error.flatten());
      return;
    }
    const bodyParsed = gradeSubmissionSchema.safeParse(request.body);
    if (!bodyParsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Datos inválidos", bodyParsed.error.flatten());
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no está configurada");
      return;
    }
    const subRows = await ctx.db.select().from(submissions).where(eq(submissions.id, paramParsed.data.id)).limit(1);
    const submission = subRows[0];
    if (!submission) {
      sendError(reply, 404, ERROR_CODES.NOT_FOUND, "Envío no encontrado");
      return;
    }
    const owns = await checkTeacherOwnsAssignment(ctx.db, submission.assignmentId, request.user!.sub, request.user?.role);
    if (!owns) {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "Permisos insuficientes");
      return;
    }
    const data = bodyParsed.data;
    const [row] = await ctx.db
      .insert(grades)
      .values({
        submissionId: submission.id,
        score: data.score,
        feedback: data.feedback ?? "",
        gradedBy: request.user!.sub,
        rubricScores: data.rubricScores ?? {},
      })
      .onConflictDoUpdate({
        target: grades.submissionId,
        set: {
          score: data.score,
          feedback: data.feedback ?? "",
          gradedBy: request.user!.sub,
          gradedAt: new Date(),
          rubricScores: data.rubricScores ?? {},
        },
      })
      .returning();
    if (!row) {
      sendError(reply, 500, ERROR_CODES.INTERNAL_ERROR, "No se pudo registrar la calificación");
      return;
    }
    await ctx.db.update(submissions).set({ status: "graded" }).where(eq(submissions.id, submission.id));
    reply.send({ data: toGrade(row) });
  });

  app.get<{ Params: { id: string } }>(`${prefix}/assignments/:id/submissions`, async (request, reply) => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;
    if (!isTeacherOrAdmin(request.user?.role)) {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "Permisos insuficientes");
      return;
    }
    const paramParsed = idParamSchema.safeParse(request.params);
    if (!paramParsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Parámetro inválido", paramParsed.error.flatten());
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no está configurada");
      return;
    }
    const owns = await checkTeacherOwnsAssignment(ctx.db, paramParsed.data.id, request.user!.sub, request.user?.role);
    if (!owns) {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "Permisos insuficientes");
      return;
    }
    const subs = await ctx.db.select().from(submissions).where(eq(submissions.assignmentId, paramParsed.data.id));
    const ids = subs.map((s) => s.id);
    const gradeRows = ids.length ? await ctx.db.select().from(grades).where(inArray(grades.submissionId, ids)) : [];
    const gradeMap = new Map(gradeRows.map((g) => [g.submissionId, g]));
    reply.send({
      data: subs.map((s) => ({
        ...toSubmission(s),
        grade: gradeMap.get(s.id) ? toGrade(gradeMap.get(s.id)!) : null,
      })),
    });
  });

  app.post(`${prefix}/storage/signed-upload`, async (request, reply) => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;
    const parsed = signedUploadSchema.safeParse(request.body);
    if (!parsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Datos inválidos", parsed.error.flatten());
      return;
    }
    const key = parsed.data.key ?? `submissions/${request.user!.sub}/${randomUUID()}`;
    const result = await ctx.storage.getSignedUploadUrl(key, parsed.data.contentType);
    reply.send({ data: result });
  });
}