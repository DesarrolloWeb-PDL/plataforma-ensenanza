import { buildApp } from "./app";

async function main(): Promise<void> {
  const { app, context } = await buildApp();

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info({ signal }, "shutting down");
    await app.close();
    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));

  await app.listen({ port: context.env.PORT, host: context.env.HOST });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});