import { badges, levels, lessons, rubrics, tracks, users } from "./schema";
import { createDb } from "./index";

const url = process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/plataforma_ensenanza";
const db = createDb(url);

async function main() {
  const insertedTracks = await db
    .insert(tracks)
    .values([
      { slug: "bloques", name: "Bloques", ageBand: "6-12", order: 1 },
      { slug: "html5-ai", name: "HTML5 + AI", ageBand: "12-17", order: 2 },
    ])
    .returning();

  const bloques = insertedTracks[0]!;
  const html5 = insertedTracks[1]!;
  await db.insert(levels).values([
    { trackId: bloques.id, order: 0, title: "L0 Descubre", projectTitle: "Mi primera animacion" },
    { trackId: bloques.id, order: 1, title: "L1 Secuencias", projectTitle: "Historia interactiva" },
    { trackId: html5.id, order: 0, title: "L0 Web basica", projectTitle: "Pagina personal" },
  ]);

  const allLevels = await db.select().from(levels);
  const allTracks = await db.select().from(tracks);
  const trackById = new Map(allTracks.map((t) => [t.id, t.slug]));
  await db.insert(lessons).values(
    allLevels.flatMap((lvl) => {
      const trackSlug = trackById.get(lvl.trackId) ?? "track";
      return [1, 2, 3].map((n) => ({
        trackId: lvl.trackId,
        levelId: lvl.id,
        order: n,
        title: `Leccion ${n}`,
        mdxRef: `content/${trackSlug}/level-${lvl.order}/lesson-${n}.mdx`,
      }));
    }),
  );

  await db.insert(badges).values([
    { slug: "first-project", name: "Primer proyecto", criteria: { type: "project_approved", count: 1 } },
    { slug: "streak-7", name: "Racha de 7 dias", criteria: { type: "streak", days: 7 } },
  ]);

  const [teacher] = await db
    .insert(users)
    .values({ email: "seed@plataforma.local", name: "Seed Teacher", role: "teacher" })
    .returning();
  if (!teacher) throw new Error("seed teacher not created");

  await db.insert(rubrics).values({
    ownerId: teacher.id,
    title: "Rubrica basica",
    criteria: [{ name: "Funcionalidad", weight: 0.6 }, { name: "Creatividad", weight: 0.4 }],
    totalPoints: 100,
  });

  console.log("seed complete");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });