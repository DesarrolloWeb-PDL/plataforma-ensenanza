import type { FastifyInstance } from "fastify";
import { eq, inArray } from "drizzle-orm";

import { attendance, classes, liveSessions } from "@plataforma/db";
import {
  ERROR_CODES,
  liveClassCreateSchema,
  liveClassUpdateSchema,
} from "@plataforma/shared";

import { AuthContext, requireAuth, sendError } from "../auth/rbac";
import { idParamSchema } from "../tracks/schemas";
import { createMeetingProvider } from "./meeting-provider";

type Ctx = AuthContext;

function isTeacherOrAdmin(role?: string): boolean {
  return role === "teacher" || role === "admin";
}

async function classTrackId(db: NonNullable<Ctx["db"]>, classId: string): Promise<string | null> {
  const rows = await db.select().from(classes).where(eq(classes.id, classId)).limit(1);
  return rows[0]?.trackId ?? null;
}

function toLiveClass(row: typeof liveSessions.$inferSelect, trackId: string) {
  const durationMin = Math.max(0, Math.round((row.endsAt.getTime() - row.startsAt.getTime()) / 60000));
  return {
    id: row.id,
    classId: row.classId,
    trackId,
    title: row.title,
    meetingUrl: row.joinUrl,
    provider: "external-link",
    scheduledAt: row.startsAt.toISOString(),
    durationMin,
    recordingUrl: row.recordingUrl ?? null,
  };
}

function toAttendance(row: typeof attendance.$inferSelect) {
  return {
    liveClassId: row.liveSessionId,
    userId: row.studentId,
    joinedAt: row.createdAt.toISOString(),
  };
}

export async function registerLiveClassesRoutes(app: FastifyInstance, ctx: Ctx): Promise<void> {
  const prefix = "/api/v1";
  const provider = createMeetingProvider();

  app.get(`${prefix}/live-classes`, async (request, reply) => {
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no está configurada");
      return;
    }
    const q = request.query as { classId?: string; trackId?: string };
    let rows = await ctx.db.select().from(liveSessions);
    if (q.classId) rows = rows.filter((r) => r.classId === q.classId);

    const classIds = Array.from(new Set(rows.map((r) => r.classId)));
    const classRows = classIds.length
      ? await ctx.db.select().from(classes).where(inArray(classes.id, classIds))
      : [];
    const classMap = new Map(classRows.map((c) => [c.id, c]));

    if (q.trackId) {
      rows = rows.filter((r) => classMap.get(r.classId)?.trackId === q.trackId);
    }

    reply.send({ data: rows.map((r) => toLiveClass(r, classMap.get(r.classId)?.trackId ?? "")) });
  });

  app.get<{ Params: { id: string } }>(`${prefix}/live-classes/:id`, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params);
    if (!parsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Parámetro inválido", parsed.error.flatten());
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no está configurada");
      return;
    }
    const rows = await ctx.db.select().from(liveSessions).where(eq(liveSessions.id, parsed.data.id)).limit(1);
    const session = rows[0];
    if (!session) {
      sendError(reply, 404, ERROR_CODES.NOT_FOUND, "Clase en vivo no encontrada");
      return;
    }
    const trackId = (await classTrackId(ctx.db, session.classId)) ?? "";
    reply.send({ data: toLiveClass(session, trackId) });
  });

  app.post(`${prefix}/live-classes`, async (request, reply) => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;
    if (!isTeacherOrAdmin(request.user?.role)) {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "Permisos insuficientes");
      return;
    }
    const parsed = liveClassCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Datos inválidos", parsed.error.flatten());
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no está configurada");
      return;
    }
    const data = parsed.data;
    const meeting = await provider.create({
      title: data.title,
      scheduledAt: data.scheduledAt,
      durationMin: data.durationMin,
      meetingUrl: data.meetingUrl,
    });

    const startsAt = new Date(data.scheduledAt);
    const endsAt = new Date(startsAt.getTime() + data.durationMin * 60000);
    const [row] = await ctx.db
      .insert(liveSessions)
      .values({
        classId: data.classId,
        title: data.title,
        startsAt,
        endsAt,
        joinUrl: meeting.meetingUrl,
        recordingUrl: data.recordingUrl ?? null,
        status: "scheduled",
      })
      .returning();
    if (!row) {
      sendError(reply, 500, ERROR_CODES.INTERNAL_ERROR, "No se pudo crear la clase en vivo");
      return;
    }
    const trackId = (await classTrackId(ctx.db, row.classId)) ?? "";
    reply.code(201).send({ data: toLiveClass(row, trackId) });
  });

  app.patch<{ Params: { id: string } }>(`${prefix}/live-classes/:id`, async (request, reply) => {
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
    const bodyParsed = liveClassUpdateSchema.safeParse(request.body);
    if (!bodyParsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Datos inválidos", bodyParsed.error.flatten());
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no está configurada");
      return;
    }
    const data = bodyParsed.data;
    const update: Record<string, unknown> = {};
    if (data.title !== undefined) update.title = data.title;
    if (data.classId !== undefined) update.classId = data.classId;
    if (data.scheduledAt !== undefined) {
      update.startsAt = new Date(data.scheduledAt);
    }
    if (data.durationMin !== undefined || data.scheduledAt !== undefined) {
      // recompute endsAt if possible
    }
    if (data.meetingUrl !== undefined) update.joinUrl = data.meetingUrl;
    if (data.recordingUrl !== undefined) update.recordingUrl = data.recordingUrl;

    // recompute endsAt when duration or start changed
    const existingRows = await ctx.db.select().from(liveSessions).where(eq(liveSessions.id, paramParsed.data.id)).limit(1);
    const existing = existingRows[0];
    if (!existing) {
      sendError(reply, 404, ERROR_CODES.NOT_FOUND, "Clase en vivo no encontrada");
      return;
    }
    const start = data.scheduledAt ? new Date(data.scheduledAt) : existing.startsAt;
    const duration = data.durationMin ?? Math.round((existing.endsAt.getTime() - existing.startsAt.getTime()) / 60000);
    update.endsAt = new Date(start.getTime() + duration * 60000);

    const [row] = await ctx.db
      .update(liveSessions)
      .set(update)
      .where(eq(liveSessions.id, paramParsed.data.id))
      .returning();
    if (!row) {
      sendError(reply, 404, ERROR_CODES.NOT_FOUND, "Clase en vivo no encontrada");
      return;
    }
    const trackId = (await classTrackId(ctx.db, row.classId)) ?? "";
    reply.send({ data: toLiveClass(row, trackId) });
  });

  app.delete<{ Params: { id: string } }>(`${prefix}/live-classes/:id`, async (request, reply) => {
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
    await ctx.db.delete(liveSessions).where(eq(liveSessions.id, parsed.data.id));
    reply.code(204).send();
  });

  app.post<{ Params: { id: string } }>(`${prefix}/live-classes/:id/attend`, async (request, reply) => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;
    if (request.user?.role !== "student") {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "Solo los estudiantes pueden registrar asistencia");
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
    const sessionRows = await ctx.db.select().from(liveSessions).where(eq(liveSessions.id, paramParsed.data.id)).limit(1);
    if (!sessionRows[0]) {
      sendError(reply, 404, ERROR_CODES.NOT_FOUND, "Clase en vivo no encontrada");
      return;
    }
    const [row] = await ctx.db
      .insert(attendance)
      .values({
        liveSessionId: paramParsed.data.id,
        studentId: request.user!.sub,
        status: "present",
        markedBy: request.user!.sub,
      })
      .onConflictDoUpdate({
        target: [attendance.liveSessionId, attendance.studentId],
        set: { status: "present", markedBy: request.user!.sub, createdAt: new Date() },
      })
      .returning();
    if (!row) {
      sendError(reply, 500, ERROR_CODES.INTERNAL_ERROR, "No se pudo registrar la asistencia");
      return;
    }
    reply.code(201).send({ data: toAttendance(row) });
  });

  app.patch<{ Params: { id: string } }>(`${prefix}/live-classes/:id/recording`, async (request, reply) => {
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
    const body = request.body as { recordingUrl?: string | null };
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no está configurada");
      return;
    }
    const [row] = await ctx.db
      .update(liveSessions)
      .set({ recordingUrl: body?.recordingUrl ?? null })
      .where(eq(liveSessions.id, paramParsed.data.id))
      .returning();
    if (!row) {
      sendError(reply, 404, ERROR_CODES.NOT_FOUND, "Clase en vivo no encontrada");
      return;
    }
    const trackId = (await classTrackId(ctx.db, row.classId)) ?? "";
    reply.send({ data: toLiveClass(row, trackId) });
  });

  app.get<{ Params: { id: string } }>(`${prefix}/live-classes/:id/attendance`, async (request, reply) => {
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
    const rows = await ctx.db.select().from(attendance).where(eq(attendance.liveSessionId, parsed.data.id));
    reply.send({ data: rows.map(toAttendance) });
  });
}