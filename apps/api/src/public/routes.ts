import type { FastifyInstance } from "fastify";
import { count } from "drizzle-orm";

import { users, tracks, levels, lessons, assignments, submissions, worksheets, badges } from "@plataforma/db";
import { ERROR_CODES } from "@plataforma/shared";

import { sendError } from "../auth/rbac";

export async function registerPublicRoutes(app: FastifyInstance, ctx: { db: any }): Promise<void> {
  const prefix = "/api/v1";

  app.get(`${prefix}/public/stats`, async (_request, reply) => {
    if (!ctx.db) {
      sendError(reply, 503, ERROR_CODES.INTERNAL_ERROR, "La base de datos no está configurada");
      return;
    }
    const [u, tr, lv, ls, asg, sub, ws, bd] = await Promise.all([
      ctx.db.select({ c: count() }).from(users),
      ctx.db.select({ c: count() }).from(tracks),
      ctx.db.select({ c: count() }).from(levels),
      ctx.db.select({ c: count() }).from(lessons),
      ctx.db.select({ c: count() }).from(assignments),
      ctx.db.select({ c: count() }).from(submissions),
      ctx.db.select({ c: count() }).from(worksheets),
      ctx.db.select({ c: count() }).from(badges),
    ]);
    reply.send({
      data: {
        users: Number(u[0]?.c ?? 0),
        tracks: Number(tr[0]?.c ?? 0),
        levels: Number(lv[0]?.c ?? 0),
        lessons: Number(ls[0]?.c ?? 0),
        assignments: Number(asg[0]?.c ?? 0),
        submissions: Number(sub[0]?.c ?? 0),
        worksheets: Number(ws[0]?.c ?? 0),
        badges: Number(bd[0]?.c ?? 0),
      },
    });
  });
}