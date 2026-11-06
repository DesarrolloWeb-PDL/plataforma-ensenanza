import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";

import { users, parentLinks } from "@plataforma/db";
import {
  ERROR_CODES,
  linkMinorSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  type AuthTokens,
  type Role,
  type User,
} from "@plataforma/shared";

import type { Env } from "../env";
import { AuthContext, requireAuth, sendError } from "./rbac";
import { hashPassword, verifyPassword } from "./password";
import { signJwt, verifyJwt } from "./jwt";

function determineConsent(role: Role, birthDate: string | null): string {
  if (role !== "student") return "granted";
  if (!birthDate) return "pending";
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age < 13 ? "pending" : "granted";
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

function issueTokens(row: typeof users.$inferSelect, env: Env): AuthTokens {
  return {
    accessToken: signJwt(
      { sub: row.id, role: row.role as Role, locale: row.locale, type: "access", consentStatus: row.consentStatus },
      env.JWT_ACCESS_SECRET,
      env.JWT_ACCESS_TTL_SECONDS,
    ),
    refreshToken: signJwt(
      { sub: row.id, role: row.role as Role, locale: row.locale, type: "refresh", consentStatus: row.consentStatus },
      env.JWT_REFRESH_SECRET,
      env.JWT_REFRESH_TTL_SECONDS,
    ),
  };
}

export async function registerAuthRoutes(app: FastifyInstance, ctx: AuthContext): Promise<void> {
  const prefix = "/api/v1";

  app.post(`${prefix}/auth/register`, async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Datos de registro inválidos", parsed.error.flatten());
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no está configurada");
      return;
    }

    const { email, password, name, role, birthDate, locale } = parsed.data;
    const resolvedRole: Role = role ?? "student";

    const existing = await ctx.db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      sendError(reply, 409, ERROR_CODES.CONFLICT, "El correo ya está registrado");
      return;
    }

    const passwordHash = await hashPassword(password);
    const [created] = await ctx.db
      .insert(users)
      .values({
        email,
        name,
        role: resolvedRole,
        locale: locale ?? "es",
        birthDate: birthDate ?? null,
        passwordHash,
        consentStatus: determineConsent(resolvedRole, birthDate ?? null),
      })
      .returning();

    if (!created) {
      sendError(reply, 500, ERROR_CODES.INTERNAL_ERROR, "No se pudo crear el usuario");
      return;
    }

    const tokens = issueTokens(created, ctx.env);
    ctx.posthog?.capture({ distinctId: created.id, event: "signup", properties: { role: resolvedRole } });
    reply.code(201).send({ data: { user: toUser(created), tokens } });
  });

  app.post(`${prefix}/auth/login`, async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Datos de inicio de sesión inválidos", parsed.error.flatten());
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no está configurada");
      return;
    }

    const { email, password } = parsed.data;
    const rows = await ctx.db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = rows[0];
    if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
      sendError(reply, 401, ERROR_CODES.UNAUTHORIZED, "Correo o contraseña inválidos");
      return;
    }
    if (user.consentStatus === "suspended" || user.consentStatus === "revoked") {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "La cuenta de usuario está suspendida");
      return;
    }

    reply.send({ data: { user: toUser(user), tokens: issueTokens(user, ctx.env) } });
  });

  app.post(`${prefix}/auth/refresh`, async (request, reply) => {
    const parsed = refreshSchema.safeParse(request.body);
    if (!parsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Datos de actualización inválidos", parsed.error.flatten());
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no está configurada");
      return;
    }

    const payload = verifyJwt(parsed.data.refreshToken, ctx.env.JWT_REFRESH_SECRET);
    if (!payload || payload.type !== "refresh") {
      sendError(reply, 401, ERROR_CODES.UNAUTHORIZED, "Token de actualización inválido o expirado");
      return;
    }

    const rows = await ctx.db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
    const user = rows[0];
    if (!user || user.consentStatus === "suspended" || user.consentStatus === "revoked") {
      sendError(reply, 401, ERROR_CODES.UNAUTHORIZED, "El usuario no está activo");
      return;
    }

    reply.send({ data: { user: toUser(user), tokens: issueTokens(user, ctx.env) } });
  });

  app.post(`${prefix}/auth/logout`, async (request, reply) => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;
    reply.code(204).send();
  });

  app.get(`${prefix}/me`, async (request, reply) => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;

    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no está configurada");
      return;
    }

    const rows = await ctx.db.select().from(users).where(eq(users.id, request.user!.sub)).limit(1);
    const user = rows[0];
    if (!user) {
      sendError(reply, 404, ERROR_CODES.NOT_FOUND, "Usuario no encontrado");
      return;
    }
    reply.send({ data: { user: toUser(user) } });
  });

  app.get(`${prefix}/protected`, async (request, reply) => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;
    reply.send({ data: { message: "protected", role: request.user?.role } });
  });

  app.post(`${prefix}/consent`, async (request, reply) => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;
    if (!request.user || (request.user.role !== "parent" && request.user.role !== "admin")) {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "Solo padres o administradores pueden vincular menores");
      return;
    }
    const parsed = linkMinorSchema.safeParse(request.body);
    if (!parsed.success) {
      sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Datos de consentimiento inválidos", parsed.error.flatten());
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no está configurada");
      return;
    }

    const { parentId, childId, granted } = parsed.data;
    if (request.user.role !== "admin" && request.user.sub !== parentId) {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "No se puede vincular un menor para otro padre");
      return;
    }

    const [parent] = await ctx.db.select().from(users).where(eq(users.id, parentId)).limit(1);
    const [child] = await ctx.db.select().from(users).where(eq(users.id, childId)).limit(1);
    if (!parent || !child) {
      sendError(reply, 404, ERROR_CODES.NOT_FOUND, "Padre o hijo no encontrado");
      return;
    }

    const consentGranted = granted ?? true;
    await ctx.db
      .update(users)
      .set({
        parentUserId: parentId,
        consentStatus: consentGranted ? "granted" : "pending",
        updatedAt: new Date(),
      })
      .where(eq(users.id, childId));

    const existingLinks = await ctx.db
      .select()
      .from(parentLinks)
      .where(eq(parentLinks.childId, childId))
      .limit(1);
    if (existingLinks.length > 0) {
      await ctx.db
        .update(parentLinks)
        .set({
          consentGrantedAt: consentGranted ? new Date() : null,
          revokedAt: consentGranted ? null : new Date(),
        })
        .where(eq(parentLinks.childId, childId));
    } else {
      await ctx.db.insert(parentLinks).values({
        parentId,
        childId,
        consentGrantedAt: consentGranted ? new Date() : null,
        revokedAt: consentGranted ? null : new Date(),
      });
    }

    reply.code(201).send({
      data: { parentId, childId, consentGranted },
    });
  });

  app.delete<{ Params: { childId: string } }>(`${prefix}/consent/:childId`, async (request, reply) => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;
    if (!request.user || (request.user.role !== "parent" && request.user.role !== "admin")) {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "Solo padres o administradores pueden revocar consentimiento");
      return;
    }
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no está configurada");
      return;
    }

    const { childId } = request.params;
    const links = await ctx.db.select().from(parentLinks).where(eq(parentLinks.childId, childId)).limit(1);
    const link = links[0];
    if (!link) {
      sendError(reply, 404, ERROR_CODES.NOT_FOUND, "Vínculo parental no encontrado");
      return;
    }
    if (request.user.role !== "admin" && link.parentId !== request.user.sub) {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "No se puede revocar el consentimiento del hijo de otro padre");
      return;
    }

    await ctx.db
      .update(parentLinks)
      .set({ revokedAt: new Date() })
      .where(eq(parentLinks.childId, childId));
    await ctx.db
      .update(users)
      .set({ consentStatus: "suspended", updatedAt: new Date() })
      .where(eq(users.id, childId));

    reply.code(204).send();
  });
}