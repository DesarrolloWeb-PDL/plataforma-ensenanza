import WorksheetDownloadButton from "@/components/WorksheetDownloadButton";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface Worksheet {
  id: string;
  trackId: string | null;
  lessonId: string | null;
  title: string;
  fileKey: string;
  answerKeyFileKey: string | null;
  printable: boolean;
}

async function fetchWorksheets(): Promise<Worksheet[]> {
  const res = await fetch(`${API_BASE}/api/v1/worksheets`, { cache: "no-store" });
  if (!res.ok) return [];
  const json = (await res.json()) as { data: Worksheet[] };
  return json.data ?? [];
}

export default async function WorksheetsPage() {
  const items = await fetchWorksheets();
  return (
    <main>
      <h1>Hojas de trabajo imprimibles</h1>
      {items.length === 0 ? <p>No hay hojas de trabajo disponibles.</p> : null}
      <ul>
        {items.map((ws) => (
          <li key={ws.id}>
            <strong>{ws.title}</strong>
            {ws.printable ? <span> (imprimible)</span> : null}
            <div>
              <WorksheetDownloadButton worksheetId={ws.id} label="Descargar" suffix="download" />
              {" "}
              <WorksheetDownloadButton worksheetId={ws.id} label="Clave de respuestas" suffix="answer-key" teacherOnly />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}