import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface LiveClass {
  id: string;
  classId: string;
  trackId: string;
  title: string;
  meetingUrl: string;
  provider: string;
  scheduledAt: string;
  durationMin: number;
  recordingUrl: string | null;
}

async function fetchLiveClasses(): Promise<LiveClass[]> {
  const res = await fetch(`${API_BASE}/live-classes`, { cache: "no-store" });
  if (!res.ok) return [];
  const json = (await res.json()) as { data: LiveClass[] };
  return json.data ?? [];
}

export default async function LiveClassesPage() {
  const items = await fetchLiveClasses();
  return (
    <main>
      <h1>Clases en vivo</h1>
      {items.length === 0 ? <p>No hay clases en vivo.</p> : null}
      <ul>
        {items.map((lc) => (
          <li key={lc.id}>
            <Link href={`/live-classes/${lc.id}`}>{lc.title}</Link>
            <span> — {new Date(lc.scheduledAt).toLocaleString()} ({lc.durationMin} min)</span>
          </li>
        ))}
      </ul>
    </main>
  );
}