import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";

import { loadEnv, type Env } from "./env";
import { createDb, type Db } from "@plataforma/db";
import { createStorageProvider, type StorageProvider } from "@plataforma/storage";
import { registerAuthRoutes } from "./auth/routes";
import { registerTracksRoutes } from "./tracks/routes";
import { registerProgressRoutes } from "./progress/routes";

export interface AppContext {
  env: Env;
  db: Db | undefined;
  storage: StorageProvider;
}

export async function buildApp(inputEnv?: Env): Promise<{ app: FastifyInstance; context: AppContext }> {
  const env = inputEnv ?? loadEnv();
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean),
  });

  const db = env.DATABASE_URL ? createDb(env.DATABASE_URL) : undefined;

  const storage = createStorageProvider({
    accountId: env.R2_ACCOUNT_ID,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    bucket: env.R2_BUCKET_SUBMISSIONS,
    forceLocal: env.R2_FORCE_LOCAL,
  });

  app.get("/health", async () => ({
    status: "ok",
    service: "api",
    env: env.NODE_ENV,
  }));

  const context: AppContext = { env, db, storage };
  await registerAuthRoutes(app, context);
  await registerTracksRoutes(app, context);
  await registerProgressRoutes(app, context);

  return { app, context };
}