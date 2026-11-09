"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface Child {
  id: string;
  name: string;
  email: string;
}

interface ChildProgress {
  childId: string;
  childName: string;
  completedLessons: number;
  completedLevels: number;
}

export default function ParentDashboardPage() {
  const [token, setToken] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [progress, setProgress] = useState<ChildProgress[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = window.localStorage.getItem("accessToken");
    setToken(t);
    if (!t) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const headers = { Authorization: `Bearer ${t}` };
        const cRes = await fetch(`${API_BASE}/parent/children`, { headers });
        if (!cRes.ok) throw new Error("No se pudieron cargar los hijos");
        const cJson = (await cRes.json()) as { data: Child[] };
        const kids = cJson.data ?? [];
        setChildren(kids);

        const results = await Promise.all(
          kids.map(async (kid) => {
            const r = await fetch(`${API_BASE}/parent/children/${kid.id}/progress`, { headers });
            if (!r.ok) return null;
            const j = (await r.json()) as { data: ChildProgress };
            return j.data;
          }),
        );
        setProgress(results.filter((x): x is ChildProgress => x !== null));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <main><p>Cargando...</p></main>;
  if (!token) return <main><p>Inicia sesión para ver el panel de padres.</p></main>;

  return (
    <main>
      <h1>Panel de padres</h1>
      {error ? <p>{error}</p> : null}
      <section>
        <h2>Progreso de los hijos</h2>
        <table>
          <thead>
            <tr>
              <th>Hijo</th>
              <th>Lecciones completadas</th>
              <th>Niveles completados</th>
            </tr>
          </thead>
          <tbody>
            {progress.map((p) => (
              <tr key={p.childId}>
                <td>{p.childName}</td>
                <td>{p.completedLessons}</td>
                <td>{p.completedLevels}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {children.length === 0 ? <p>Sin hijos vinculados.</p> : null}
      </section>
    </main>
  );
}