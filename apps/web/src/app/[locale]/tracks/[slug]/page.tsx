import Link from "next/link";
import { getTranslations } from "next-intl/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface Track {
  id: string;
  slug: string;
  name: string;
  ageBand: string;
  order: number;
}

interface Level {
  id: string;
  trackId: string;
  order: number;
  title: string;
  projectTitle: string;
}

async function fetchTrack(slug: string): Promise<Track | null> {
  const res = await fetch(`${API_BASE}/api/v1/tracks/${slug}`, { cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as { data: Track };
  return json.data;
}

async function fetchLevels(slug: string): Promise<Level[]> {
  const res = await fetch(`${API_BASE}/api/v1/tracks/${slug}/levels`, { cache: "no-store" });
  if (!res.ok) return [];
  const json = (await res.json()) as { data: Level[] };
  return json.data;
}

export default async function TrackDetailPage({ params }: { params: { slug: string } }) {
  const t = await getTranslations("tracks");
  const track = await fetchTrack(params.slug);
  if (!track) {
    return <main><h1>{t("notFound")}</h1></main>;
  }
  const levels = await fetchLevels(params.slug);

  return (
    <main>
      <h1>{track.name}</h1>
      <p>{track.ageBand}</p>
      <h2>{t("levels")}</h2>
      <ul>
        {levels.map((level) => (
          <li key={level.id}>
            <Link href={`/tracks/${track.slug}/levels/${level.id}`}>{level.title}</Link>
            <span> — {level.projectTitle}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}