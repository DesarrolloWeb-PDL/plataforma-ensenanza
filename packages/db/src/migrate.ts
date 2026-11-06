import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const url = process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/plataforma_ensenanza";
const client = postgres(url, { max: 1 });
const db = drizzle(client);
await migrate(db, { migrationsFolder: "./migrations" });
await client.end();
console.log("migrations applied");