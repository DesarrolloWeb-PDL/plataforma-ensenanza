import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";

import { loadEnv, type Env } from "./env";
import { createDb, type Db } from "@plataforma/db";

export interface AppContext {
  env: Env;
  db?: Db | undefined;
}

export async function buildApp(inputEnv?: Env): Promise<{ app: FastifyInstance; context: AppContext }> {
  const env = inputEnv ?? loadEnv();
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean),
  });

  const db = env.DATABASE_URL ? createDb(env.DATABASE_URL) : undefined;

  app.get("/health", async () => ({
    status: "ok",
    service: "api",
    env: env.NODE_ENV,
  }));

  const context: AppContext = { env, db };
  return { app, context };
}