import type { FastifyInstance } from "fastify";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";

import {
  badges,
  minorConsents,
  userBadges,
  users,
} from "@plataforma/db";
import {
  ERROR_CODES,
  type Badge as SharedBadge,
  type ConsentStatus as SharedConsentStatus,
  type Streak as SharedStreak,
  type XpSummary as SharedXpSummary,
  linkMinorSchema,
} from "@plataforma/shared";
import { AuthContext, requireAuth, sendError } from "../auth/rbac";
import {
  awardBadges,
  getXpTotal,
  updateStreak,
} from "./service";

const grantSchema = z.object({
  parentId: z.string().uuid().optional(),
  childId: z.string().uuid().optional(),
  minorUserId: z.string().uuid().optional(),
  granted: z.boolean().optional(),
});

const revokeSchema = z.object({
  parentId: z.string().uuid().optional(),
  childId: z.string().uuid().optional(),
  minorUserId: z.string().uuid().optional(),
});

const statusQuerySchema = z.object({
  childId: z.string().uuid().optional(),
  minorUserId: z.string().uuid().optional(),
});

function toBadge(row: typeof badges.$inferSelect): SharedBadge {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    criteria: row.criteria,
    trackId: row.trackId ?? null,
  };
}

function resolveChildId(body: { childId?: string | undefined; minorUserId?: string | undefined }): string | undefined {
  return body.childId ?? body.minorUserId;
}

export async function registerGamificationRoutes(app: FastifyInstance, ctx: AuthContext): Promise<void> {
  const prefix = "/api/v1";

  app.get(`${prefix}/me/xp`, async (request, reply) => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no esta configurada");
      return;
    }
    const userId = request.user!.sub;
    const totalXp = await getXpTotal(ctx.db, userId);
    const data: SharedXpSummary = { userId, totalXp };
    reply.send({ data });
  });

  app.get(`${prefix}/me/badges`, async (request, reply) => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no esta configurada");
      return;
    }
    const db = ctx.db;
    const userId = request.user!.sub;
    const owned = await db.select().from(userBadges).where(eq(userBadges.userId, userId));
    const badgeIds = owned.map((r) => r.badgeId);
    const badgeRows = badgeIds.length ? await db.select().from(badges).where(inArray(badges.id, badgeIds)) : [];
    reply.send({ data: badgeRows.map(toBadge) });
  });

  app.post(`${prefix}/me/streak/check-in`, async (request, reply) => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no esta configurada");
      return;
    }
    const userId = request.user!.sub;
    const streak = await updateStreak(ctx.db, userId);
    await awardBadges(ctx.db, userId);
    const data: SharedStreak = streak;
    reply.send({ data });
  });

  // Consent: link parent to minor
  app.post(`${prefix}/consent/link`, async (request, reply) => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;
    if (!request.user || (request.user.role !== "parent" && request.user.role !== "admin")) {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "Solo padres o administradores pueden vincular menores");
      return;
    }
    const parsed = linkMinorSchema.safeParse(request.body);
    if (!parsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Datos de consentimiento invalidos", parsed.error.flatten());
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no esta configurada");
      return;
    }
    const db = ctx.db;
    const { parentId, childId, granted } = parsed.data;
    if (request.user.role !== "admin" && request.user.sub !== parentId) {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "No se puede vincular un menor para otro padre");
      return;
    }

    const [parent] = await db.select().from(users).where(eq(users.id, parentId)).limit(1);
    const [child] = await db.select().from(users).where(eq(users.id, childId)).limit(1);
    if (!parent || !child) {
      sendError(reply, 404, ERROR_CODES.NOT_FOUND, "Padre o hijo no encontrado");
      return;
    }

    const consentGranted = granted ?? true;
    await db
      .update(users)
      .set({
        parentUserId: parentId,
        consentStatus: consentGranted ? "granted" : "pending",
        updatedAt: new Date(),
      })
      .where(eq(users.id, childId));

    const existing = await db
      .select()
      .from(minorConsents)
      .where(eq(minorConsents.minorUserId, childId))
      .limit(1);
    // filter by parent pair
    const pair = existing.find((r) => r.parentUserId === parentId);
    if (pair) {
      await db
        .update(minorConsents)
        .set({
          consentedAt: consentGranted ? new Date() : null,
          revokedAt: consentGranted ? null : new Date(),
        })
        .where(eq(minorConsents.id, pair.id));
    } else {
      await db.insert(minorConsents).values({
        minorUserId: childId,
        parentUserId: parentId,
        consentedAt: consentGranted ? new Date() : null,
        revokedAt: consentGranted ? null : new Date(),
      });
    }

    reply.code(201).send({ data: { parentId, childId, consentGranted } });
  });

  app.post(`${prefix}/consent/grant`, async (request, reply) => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;
    const parsed = grantSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Datos de consentimiento invalidos", parsed.error.flatten());
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no esta configurada");
      return;
    }
    const db = ctx.db;
    const childId = resolveChildId(parsed.data);
    if (!childId) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Falta childId");
      return;
    }
    const parentId = parsed.data.parentId ?? request.user!.sub;
    if (request.user!.role !== "admin" && request.user!.role !== "parent" && request.user!.sub !== parentId) {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "Permisos insuficientes");
      return;
    }
    if (request.user!.role === "parent" && request.user!.sub !== parentId) {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "No se puede otorgar consentimiento para otro padre");
      return;
    }

    const [child] = await db.select().from(users).where(eq(users.id, childId)).limit(1);
    if (!child) {
      sendError(reply, 404, ERROR_CODES.NOT_FOUND, "Hijo no encontrado");
      return;
    }

    await db
      .update(users)
      .set({ parentUserId: parentId, consentStatus: "granted", updatedAt: new Date() })
      .where(eq(users.id, childId));

    const existing = await db
      .select()
      .from(minorConsents)
      .where(eq(minorConsents.minorUserId, childId));
    const pair = existing.find((r) => r.parentUserId === parentId);
    if (pair) {
      await db
        .update(minorConsents)
        .set({ consentedAt: new Date(), revokedAt: null })
        .where(eq(minorConsents.id, pair.id));
    } else {
      await db.insert(minorConsents).values({
        minorUserId: childId,
        parentUserId: parentId,
        consentedAt: new Date(),
        revokedAt: null,
      });
    }

    reply.send({ data: { parentId, childId, consentGranted: true } });
  });

  app.post(`${prefix}/consent/revoke`, async (request, reply) => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;
    const parsed = revokeSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Datos de consentimiento invalidos", parsed.error.flatten());
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no esta configurada");
      return;
    }
    const db = ctx.db;
    const childId = resolveChildId(parsed.data);
    if (!childId) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Falta childId");
      return;
    }
    const parentId = parsed.data.parentId ?? request.user!.sub;

    await db
      .update(users)
      .set({ consentStatus: "revoked", updatedAt: new Date() })
      .where(eq(users.id, childId));

    const existing = await db
      .select()
      .from(minorConsents)
      .where(eq(minorConsents.minorUserId, childId));
    const pair = existing.find((r) => r.parentUserId === parentId);
    if (pair) {
      await db
        .update(minorConsents)
        .set({ revokedAt: new Date() })
        .where(eq(minorConsents.id, pair.id));
    } else {
      await db.insert(minorConsents).values({
        minorUserId: childId,
        parentUserId: parentId,
        consentedAt: null,
        revokedAt: new Date(),
      });
    }

    reply.code(204).send();
  });

  app.get(`${prefix}/consent/status`, async (request, reply) => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;
    const parsed = statusQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Parametros invalidos", parsed.error.flatten());
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no esta configurada");
      return;
    }
    const db = ctx.db;
    const userId = request.user!.sub;
    const role = request.user!.role;

    let targetUserId = userId;
    const requestedChild = parsed.data.childId ?? parsed.data.minorUserId;
    if (requestedChild && (role === "parent" || role === "admin")) {
      targetUserId = requestedChild;
    }

    const [user] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
    if (!user) {
      sendError(reply, 404, ERROR_CODES.NOT_FOUND, "Usuario no encontrado");
      return;
    }

    let linksRows;
    if (role === "parent" || role === "admin") {
      if (requestedChild) {
        linksRows = await db.select().from(minorConsents).where(eq(minorConsents.minorUserId, targetUserId));
      } else {
        linksRows = await db.select().from(minorConsents).where(eq(minorConsents.parentUserId, userId));
      }
    } else {
      linksRows = await db.select().from(minorConsents).where(eq(minorConsents.minorUserId, userId));
    }

    const links = linksRows.map((r) => ({
      parentId: r.parentUserId,
      childId: r.minorUserId,
      consentedAt: r.consentedAt ? r.consentedAt.toISOString() : null,
      revokedAt: r.revokedAt ? r.revokedAt.toISOString() : null,
    }));

    const data: SharedConsentStatus = {
      userId: user.id,
      consentStatus: user.consentStatus,
      parentUserId: user.parentUserId ?? null,
      links,
    };
    reply.send({ data });
  });
}