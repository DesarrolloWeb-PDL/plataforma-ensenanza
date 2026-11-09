import LiveClassJoinButton from "@/components/LiveClassJoinButton";

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

async function fetchLiveClass(id: string): Promise<LiveClass | null> {
  const res = await fetch(`${API_BASE}/live-classes/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as { data: LiveClass };
  return json.data;
}

export default async function LiveClassPage({ params }: { params: { id: string } }) {
  const lc = await fetchLiveClass(params.id);
  if (!lc) {
    return <main><h1>Clase en vivo no encontrada</h1></main>;
  }
  return (
    <main>
      <h1>{lc.title}</h1>
      <p>Proveedor: {lc.provider}</p>
      <p>Inicio: {new Date(lc.scheduledAt).toLocaleString()}</p>
      <p>Duración: {lc.durationMin} min</p>
      <LiveClassJoinButton liveClassId={lc.id} meetingUrl={lc.meetingUrl} />
      {lc.recordingUrl ? (
        <p>
          <a href={lc.recordingUrl} target="_blank" rel="noreferrer">Ver grabación</a>
        </p>
      ) : null}
    </main>
  );
}