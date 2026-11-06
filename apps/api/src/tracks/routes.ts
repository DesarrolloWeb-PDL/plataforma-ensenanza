import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";

import { levels, lessons, tracks } from "@plataforma/db";
import { ERROR_CODES } from "@plataforma/shared";

import { AuthContext, sendError } from "../auth/rbac";
import { idParamSchema, slugParamSchema } from "./schemas";

export async function registerTracksRoutes(app: FastifyInstance, ctx: AuthContext): Promise<void> {
  const prefix = "/api/v1";

  app.get(`${prefix}/tracks`, async (_request, reply) => {
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no estǭ configurada");
      return;
    }
    const rows = await ctx.db.select().from(tracks).orderBy(tracks.order);
    reply.send({ data: rows });
  });

  app.get<{ Params: { slug: string } }>(`${prefix}/tracks/:slug`, async (request, reply) => {
    const parsed = slugParamSchema.safeParse(request.params);
    if (!parsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Parǭmetro invǭlido", parsed.error.flatten());
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no estǭ configurada");
      return;
    }
    const rows = await ctx.db.select().from(tracks).where(eq(tracks.slug, parsed.data.slug)).limit(1);
    const track = rows[0];
    if (!track) {
      sendError(reply, 404, ERROR_CODES.NOT_FOUND, "Track no encontrado");
      return;
    }
    reply.send({ data: track });
  });

  app.get<{ Params: { slug: string } }>(`${prefix}/tracks/:slug/levels`, async (request, reply) => {
    const parsed = slugParamSchema.safeParse(request.params);
    if (!parsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Parǭmetro invǭlido", parsed.error.flatten());
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no estǭ configurada");
      return;
    }
    const trackRows = await ctx.db.select().from(tracks).where(eq(tracks.slug, parsed.data.slug)).limit(1);
    const track = trackRows[0];
    if (!track) {
      sendError(reply, 404, ERROR_CODES.NOT_FOUND, "Track no encontrado");
      return;
    }
    const rows = await ctx.db
      .select()
      .from(levels)
      .where(eq(levels.trackId, track.id))
      .orderBy(levels.order);
    reply.send({ data: rows });
  });

  app.get<{ Params: { id: string } }>(`${prefix}/levels/:id`, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params);
    if (!parsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Parǭmetro invǭlido", parsed.error.flatten());
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no estǭ configurada");
      return;
    }
    const rows = await ctx.db.select().from(levels).where(eq(levels.id, parsed.data.id)).limit(1);
    const level = rows[0];
    if (!level) {
      sendError(reply, 404, ERROR_CODES.NOT_FOUND, "Nivel no encontrado");
      return;
    }
    reply.send({ data: level });
  });

  app.get<{ Params: { id: string } }>(`${prefix}/levels/:id/lessons`, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params);
    if (!parsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Parǭmetro invǭlido", parsed.error.flatten());
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no estǭ configurada");
      return;
    }
    const rows = await ctx.db
      .select()
      .from(lessons)
      .where(eq(lessons.levelId, parsed.data.id))
      .orderBy(lessons.order);
    reply.send({ data: rows });
  });

  app.get<{ Params: { id: string } }>(`${prefix}/lessons/:id`, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params);
    if (!parsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Parǭmetro invǭlido", parsed.error.flatten());
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no estǭ configurada");
      return;
    }
    const rows = await ctx.db.select().from(lessons).where(eq(lessons.id, parsed.data.id)).limit(1);
    const lesson = rows[0];
    if (!lesson) {
      sendError(reply, 404, ERROR_CODES.NOT_FOUND, "Lecci��n no encontrada");
      return;
    }
    reply.send({ data: lesson });
  });
}