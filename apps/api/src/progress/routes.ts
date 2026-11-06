import type { FastifyInstance } from "fastify";
import { and, eq } from "drizzle-orm";

import { lessons, lessonProgress, levelCompletions, levels, tracks } from "@plataforma/db";
import { ERROR_CODES } from "@plataforma/shared";

import { AuthContext, requireAuth, sendError } from "../auth/rbac";
import { idParamSchema, slugParamSchema } from "../tracks/schemas";
import { awardBadges, awardXp, updateStreak } from "../gamification/service";

function toLessonProgress(row: typeof lessonProgress.$inferSelect) {
  return {
    id: row.id,
    studentId: row.studentId,
    lessonId: row.lessonId,
    completedAt: row.completedAt.toISOString(),
    xpAwarded: row.xpAwarded,
  };
}

function toLevelCompletion(row: typeof levelCompletions.$inferSelect) {
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

export async function registerProgressRoutes(app: FastifyInstance, ctx: AuthContext): Promise<void> {
  const prefix = "/api/v1";

  app.post<{ Params: { id: string } }>(`${prefix}/lessons/:id/complete`, async (request, reply) => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;
    if (!request.user || request.user.role !== "student") {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "Solo los estudiantes pueden marcar lecciones como completadas");
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

    const lessonRows = await ctx.db.select().from(lessons).where(eq(lessons.id, parsed.data.id)).limit(1);
    if (!lessonRows[0]) {
      sendError(reply, 404, ERROR_CODES.NOT_FOUND, "Lección no encontrada");
      return;
    }

    const existingProgress = await ctx.db
      .select()
      .from(lessonProgress)
      .where(and(eq(lessonProgress.studentId, request.user.sub), eq(lessonProgress.lessonId, parsed.data.id)))
      .limit(1);

    let row;
    if (existingProgress[0]) {
      [row] = await ctx.db
        .update(lessonProgress)
        .set({ completedAt: new Date() })
        .where(eq(lessonProgress.id, existingProgress[0].id))
        .returning();
      if (!row) row = existingProgress[0];
    } else {
      [row] = await ctx.db
        .insert(lessonProgress)
        .values({
          studentId: request.user.sub,
          lessonId: parsed.data.id,
          completedAt: new Date(),
          xpAwarded: 10,
        })
        .returning();
      if (row) {
        await awardXp(ctx.db, request.user.sub, 10, "lesson_complete", "lesson", parsed.data.id);
        await updateStreak(ctx.db, request.user.sub);
        await awardBadges(ctx.db, request.user.sub);
      }
    }

    if (!row) {
      sendError(reply, 500, ERROR_CODES.INTERNAL_ERROR, "No se pudo registrar el progreso");
      return;
    }
    reply.send({ data: toLessonProgress(row) });
  });

  app.post<{ Params: { id: string } }>(`${prefix}/levels/:id/complete`, async (request, reply) => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;
    if (!request.user || request.user.role !== "student") {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "Solo los estudiantes pueden marcar niveles como completados");
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

    const levelRows = await ctx.db.select().from(levels).where(eq(levels.id, parsed.data.id)).limit(1);
    if (!levelRows[0]) {
      sendError(reply, 404, ERROR_CODES.NOT_FOUND, "Nivel no encontrado");
      return;
    }

    const existingCompletion = await ctx.db
      .select()
      .from(levelCompletions)
      .where(and(eq(levelCompletions.studentId, request.user.sub), eq(levelCompletions.levelId, parsed.data.id)))
      .limit(1);

    let row;
    if (existingCompletion[0]) {
      [row] = await ctx.db
        .update(levelCompletions)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(levelCompletions.id, existingCompletion[0].id))
        .returning();
      if (!row) row = existingCompletion[0];
    } else {
      [row] = await ctx.db
        .insert(levelCompletions)
        .values({
          studentId: request.user.sub,
          levelId: parsed.data.id,
          status: "completed",
          completedAt: new Date(),
        })
        .returning();
      if (row) {
        await awardXp(ctx.db, request.user.sub, 50, "level_complete", "level", parsed.data.id);
        await updateStreak(ctx.db, request.user.sub);
        await awardBadges(ctx.db, request.user.sub);
      }
    }

    if (!row) {
      sendError(reply, 500, ERROR_CODES.INTERNAL_ERROR, "No se pudo registrar la finalización del nivel");
      return;
    }
    reply.send({ data: toLevelCompletion(row) });
  });

  app.get(`${prefix}/me/progress`, async (request, reply) => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no está configurada");
      return;
    }

    const studentId = request.user!.sub;
    const lessonsRows = await ctx.db.select().from(lessonProgress).where(eq(lessonProgress.studentId, studentId));
    const levelsRows = await ctx.db.select().from(levelCompletions).where(eq(levelCompletions.studentId, studentId));

    reply.send({
      data: {
        lessons: lessonsRows.map(toLessonProgress),
        levels: levelsRows.map(toLevelCompletion),
      },
    });
  });

  app.get<{ Params: { slug: string } }>(`${prefix}/tracks/:slug/progress`, async (request, reply) => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;

    const parsed = slugParamSchema.safeParse(request.params);
    if (!parsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Parámetro inválido", parsed.error.flatten());
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no está configurada");
      return;
    }

    const trackRows = await ctx.db.select().from(tracks).where(eq(tracks.slug, parsed.data.slug)).limit(1);
    const track = trackRows[0];
    if (!track) {
      sendError(reply, 404, ERROR_CODES.NOT_FOUND, "Track no encontrado");
      return;
    }

    const trackLevels = await ctx.db.select().from(levels).where(eq(levels.trackId, track.id));
    const trackLessons = await ctx.db.select().from(lessons).where(eq(lessons.trackId, track.id));

    const studentId = request.user!.sub;
    const levelIds = new Set(trackLevels.map((l) => l.id));
    const lessonIds = new Set(trackLessons.map((l) => l.id));

    const allLessonProgress = await ctx.db.select().from(lessonProgress).where(eq(lessonProgress.studentId, studentId));
    const allLevelCompletions = await ctx.db.select().from(levelCompletions).where(eq(levelCompletions.studentId, studentId));

    reply.send({
      data: {
        lessons: allLessonProgress.filter((p) => lessonIds.has(p.lessonId)).map(toLessonProgress),
        levels: allLevelCompletions.filter((c) => levelIds.has(c.levelId)).map(toLevelCompletion),
      },
    });
  });
}