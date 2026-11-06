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

async function fetchTracks(): Promise<Track[]> {
  const res = await fetch(`${API_BASE}/api/v1/tracks`, { cache: "no-store" });
  if (!res.ok) return [];
  const json = (await res.json()) as { data: Track[] };
  return json.data;
}

export default async function TracksPage() {
  const t = await getTranslations("tracks");
  const tracks = await fetchTracks();

  return (
    <main>
      <h1>{t("title")}</h1>
      <ul>
        {tracks.map((track) => (
          <li key={track.id}>
            <Link href={`/tracks/${track.slug}`}>{track.name}</Link>
            <span> ({track.ageBand})</span>
          </li>
        ))}
      </ul>
    </main>
  );
}