import type { FastifyInstance, FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";

import { worksheets } from "@plataforma/db";
import {
  ERROR_CODES,
  worksheetCreateSchema,
  worksheetUpdateSchema,
} from "@plataforma/shared";
import type { StorageProvider } from "@plataforma/storage";
import { verifyJwt } from "../auth/jwt";
import { AuthContext, requireAuth, sendError } from "../auth/rbac";
import { idParamSchema } from "../tracks/schemas";

type Ctx = AuthContext & { storage: StorageProvider };

function isTeacherOrAdmin(role?: string): boolean {
  return role === "teacher" || role === "admin";
}

function tryRole(request: FastifyRequest, ctx: AuthContext): string | undefined {
  const authorization = request.headers.authorization;
  if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) return undefined;
  const token = authorization.slice("Bearer ".length).trim();
  const payload = verifyJwt(token, ctx.env.JWT_ACCESS_SECRET);
  return payload?.role;
}

function toWorksheet(row: typeof worksheets.$inferSelect, includeAnswerKey: boolean) {
  return {
    id: row.id,
    trackId: row.trackId ?? null,
    lessonId: row.lessonId ?? null,
    title: row.title,
    fileKey: row.fileKey,
    answerKeyFileKey: includeAnswerKey ? (row.answerKeyFileKey ?? null) : null,
    printable: row.printable,
  };
}

export async function registerWorksheetsRoutes(app: FastifyInstance, ctx: Ctx): Promise<void> {
  const prefix = "/api/v1";

  app.get(`${prefix}/worksheets`, async (request, reply) => {
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no esta configurada");
      return;
    }
    const q = request.query as { trackId?: string; lessonId?: string };
    let rows = await ctx.db.select().from(worksheets);
    if (q.trackId) rows = rows.filter((r) => r.trackId === q.trackId);
    if (q.lessonId) rows = rows.filter((r) => r.lessonId === q.lessonId);
    const includeAnswerKey = isTeacherOrAdmin(tryRole(request, ctx));
    reply.send({ data: rows.map((r) => toWorksheet(r, includeAnswerKey)) });
  });

  app.get<{ Params: { id: string } }>(`${prefix}/worksheets/:id`, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params);
    if (!parsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Parametro invalido", parsed.error.flatten());
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no esta configurada");
      return;
    }
    const rows = await ctx.db.select().from(worksheets).where(eq(worksheets.id, parsed.data.id)).limit(1);
    const worksheet = rows[0];
    if (!worksheet) {
      sendError(reply, 404, ERROR_CODES.NOT_FOUND, "Hoja de trabajo no encontrada");
      return;
    }
    const includeAnswerKey = isTeacherOrAdmin(tryRole(request, ctx));
    reply.send({ data: toWorksheet(worksheet, includeAnswerKey) });
  });

  app.post(`${prefix}/worksheets`, async (request, reply) => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;
    if (!isTeacherOrAdmin(request.user?.role)) {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "Permisos insuficientes");
      return;
    }
    const parsed = worksheetCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Datos invalidos", parsed.error.flatten());
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no esta configurada");
      return;
    }
    const data = parsed.data;
    const [row] = await ctx.db
      .insert(worksheets)
      .values({
        trackId: data.trackId ?? null,
        lessonId: data.lessonId ?? null,
        title: data.title,
        fileKey: data.fileKey,
        answerKeyFileKey: data.answerKeyFileKey ?? null,
        printable: data.printable ?? true,
      })
      .returning();
    if (!row) {
      sendError(reply, 500, ERROR_CODES.INTERNAL_ERROR, "No se pudo crear la hoja de trabajo");
      return;
    }
    reply.code(201).send({ data: toWorksheet(row, true) });
  });

  app.patch<{ Params: { id: string } }>(`${prefix}/worksheets/:id`, async (request, reply) => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;
    if (!isTeacherOrAdmin(request.user?.role)) {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "Permisos insuficientes");
      return;
    }
    const paramParsed = idParamSchema.safeParse(request.params);
    if (!paramParsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Parametro invalido", paramParsed.error.flatten());
      return;
    }
    const bodyParsed = worksheetUpdateSchema.safeParse(request.body);
    if (!bodyParsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Datos invalidos", bodyParsed.error.flatten());
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no esta configurada");
      return;
    }
    const data = bodyParsed.data;
    const update: Record<string, unknown> = {};
    if (data.trackId !== undefined) update.trackId = data.trackId;
    if (data.lessonId !== undefined) update.lessonId = data.lessonId;
    if (data.title !== undefined) update.title = data.title;
    if (data.fileKey !== undefined) update.fileKey = data.fileKey;
    if (data.answerKeyFileKey !== undefined) update.answerKeyFileKey = data.answerKeyFileKey;
    if (data.printable !== undefined) update.printable = data.printable;

    const [row] = await ctx.db
      .update(worksheets)
      .set(update)
      .where(eq(worksheets.id, paramParsed.data.id))
      .returning();
    if (!row) {
      sendError(reply, 404, ERROR_CODES.NOT_FOUND, "Hoja de trabajo no encontrada");
      return;
    }
    reply.send({ data: toWorksheet(row, true) });
  });

  app.delete<{ Params: { id: string } }>(`${prefix}/worksheets/:id`, async (request, reply) => {
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
    await ctx.db.delete(worksheets).where(eq(worksheets.id, parsed.data.id));
    reply.code(204).send();
  });

  app.get<{ Params: { id: string } }>(`${prefix}/worksheets/:id/download`, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params);
    if (!parsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Parametro invalido", parsed.error.flatten());
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no esta configurada");
      return;
    }
    const rows = await ctx.db.select().from(worksheets).where(eq(worksheets.id, parsed.data.id)).limit(1);
    const worksheet = rows[0];
    if (!worksheet) {
      sendError(reply, 404, ERROR_CODES.NOT_FOUND, "Hoja de trabajo no encontrada");
      return;
    }
    const result = await ctx.storage.getSignedDownloadUrl(worksheet.fileKey);
    reply.send({ data: result });
  });

  app.get<{ Params: { id: string } }>(`${prefix}/worksheets/:id/answer-key`, async (request, reply) => {
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
    const rows = await ctx.db.select().from(worksheets).where(eq(worksheets.id, parsed.data.id)).limit(1);
    const worksheet = rows[0];
    if (!worksheet) {
      sendError(reply, 404, ERROR_CODES.NOT_FOUND, "Hoja de trabajo no encontrada");
      return;
    }
    if (!worksheet.answerKeyFileKey) {
      sendError(reply, 404, ERROR_CODES.NOT_FOUND, "Clave de respuestas no disponible");
      return;
    }
    const result = await ctx.storage.getSignedDownloadUrl(worksheet.answerKeyFileKey);
    reply.send({ data: result });
  });
}