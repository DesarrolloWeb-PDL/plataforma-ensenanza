import { createDb } from "./src/index.ts";
const db = createDb(process.env.DATABASE_URL);
const { lessons } = await import("./src/schema.ts");
const rows = await db.select().from(lessons);
console.log(JSON.stringify(rows.map(l => ({ id: l.id, title: l.title, mdxRef: l.mdxRef })), null, 2));