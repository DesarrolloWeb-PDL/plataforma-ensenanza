import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";

import { users } from "@plataforma/db";
import { ERROR_CODES, ROLES } from "@plataforma/shared";

import { AuthContext, requireRole, sendError } from "../auth/rbac";

export async function registerAdminRoutes(app: FastifyInstance, ctx: AuthContext): Promise<void> {
  const prefix = "/api/v1";
  const requireAdmin = requireRole(ctx, "admin");

  app.get(`${prefix}/admin/users`, { preHandler: requireAdmin }, async (_request, reply) => {
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no está configurada");
      return;
    }
    const rows = await ctx.db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        locale: users.locale,
        createdAt: users.createdAt,
      })
      .from(users);
    reply.send({ data: rows });
  });

  app.patch<{ Params: { id: string } }>(
    `${prefix}/admin/users/:id/role`,
    { preHandler: requireAdmin },
    async (request, reply) => {
      if (!ctx.db) {
        sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no está configurada");
        return;
      }
      const body = request.body as { role?: string } | undefined;
      const role = body?.role;
      if (!role || !ROLES.includes(role as (typeof ROLES)[number])) {
        sendError(reply, 400, ERROR_CODES.VALIDATION_ERROR, "Rol inválido");
        return;
      }
      const [updated] = await ctx.db
        .update(users)
        .set({ role: role as (typeof ROLES)[number] })
        .where(eq(users.id, request.params.id))
        .returning({ id: users.id, role: users.role });
      if (!updated) {
        sendError(reply, 404, ERROR_CODES.NOT_FOUND, "Usuario no encontrado");
        return;
      }
      reply.send({ data: updated });
    },
  );
}