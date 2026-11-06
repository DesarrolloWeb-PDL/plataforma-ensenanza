import type { FastifyReply, FastifyRequest } from "fastify";
import type { Db } from "@plataforma/db";
import type { Env } from "../env";
import type { JwtPayload } from "./jwt";
import { verifyJwt } from "./jwt";
import { ERROR_CODES } from "@plataforma/shared";

declare module "fastify" {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

export interface AuthContext {
  env: Env;
  db: Db | undefined;
}

export function sendError(
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
): void {
  reply.code(statusCode).send({
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
  });
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply, ctx: AuthContext): Promise<void> {
  const authorization = request.headers.authorization;
  if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) {
    sendError(reply, 401, ERROR_CODES.UNAUTHORIZED, "Missing or invalid authorization header");
    return;
  }

  const token = authorization.slice("Bearer ".length).trim();
  const payload = verifyJwt(token, ctx.env.JWT_ACCESS_SECRET);
  if (!payload || payload.type !== "access") {
    sendError(reply, 401, ERROR_CODES.UNAUTHORIZED, "Invalid or expired access token");
    return;
  }

  request.user = payload;
}

export function requireRole(ctx: AuthContext, ...roles: Array<JwtPayload["role"]>) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await requireAuth(request, reply, ctx);
    if (reply.sent) return;
    if (!request.user || !roles.includes(request.user.role)) {
      sendError(reply, 403, ERROR_CODES.FORBIDDEN, "Insufficient role");
    }
  };
}