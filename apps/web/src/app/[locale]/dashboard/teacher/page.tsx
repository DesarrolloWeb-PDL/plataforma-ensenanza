"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface ClassItem {
  id: string;
  title: string;
  trackId: string;
  trackName: string | null;
}

interface RosterEntry {
  userId: string;
  name: string;
  email: string;
  role: string;
  enrolledAt: string;
}

interface ProgressEntry {
  studentId: string;
  studentName: string;
  lessonsCompleted: number;
  levelsCompleted: number;
}

interface GradingQueueItem {
  submissionId: string;
  assignmentId: string;
  assignmentTitle: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  status: string;
}

export default function TeacherDashboardPage() {
  const [token, setToken] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [queue, setQueue] = useState<GradingQueueItem[]>([]);
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
        const [cRes, qRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/teacher/classes`, { headers }),
          fetch(`${API_BASE}/api/v1/teacher/grading-queue`, { headers }),
        ]);
        if (!cRes.ok || !qRes.ok) throw new Error("No se pudieron cargar los datos");
        const cJson = (await cRes.json()) as { data: ClassItem[] };
        const qJson = (await qRes.json()) as { data: GradingQueueItem[] };
        const classData = cJson.data ?? [];
        setClasses(classData);
        setQueue(qJson.data ?? []);
        const firstClass = classData[0];
        if (firstClass) setSelected(firstClass.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!token || !selected) return;
    (async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [rRes, pRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/teacher/classes/${selected}/roster`, { headers }),
          fetch(`${API_BASE}/api/v1/teacher/classes/${selected}/progress`, { headers }),
        ]);
        if (!rRes.ok || !pRes.ok) throw new Error("No se pudo cargar la clase");
        const rJson = (await rRes.json()) as { data: RosterEntry[] };
        const pJson = (await pRes.json()) as { data: ProgressEntry[] };
        setRoster(rJson.data ?? []);
        setProgress(pJson.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      }
    })();
  }, [token, selected]);

  if (loading) return <main><p>Cargando...</p></main>;
  if (!token) return <main><p>Inicia sesión para ver el panel docente.</p></main>;

  return (
    <main>
      <h1>Panel docente</h1>
      {error ? <p>{error}</p> : null}
      <section>
        <h2>Clases</h2>
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        {classes.length === 0 ? <p>Sin clases.</p> : null}
      </section>
      <section>
        <h2>Roster</h2>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((r) => (
              <tr key={r.userId}>
                <td>{r.name}</td>
                <td>{r.email}</td>
                <td>{r.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h2>Progreso</h2>
        <table>
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Lecciones</th>
              <th>Niveles</th>
            </tr>
          </thead>
          <tbody>
            {progress.map((p) => (
              <tr key={p.studentId}>
                <td>{p.studentName}</td>
                <td>{p.lessonsCompleted}</td>
                <td>{p.levelsCompleted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h2>Cola de calificación</h2>
        <table>
          <thead>
            <tr>
              <th>Tarea</th>
              <th>Estudiante</th>
              <th>Enviado</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {queue.map((q) => (
              <tr key={q.submissionId}>
                <td>{q.assignmentTitle}</td>
                <td>{q.studentName}</td>
                <td>{new Date(q.submittedAt).toLocaleString()}</td>
                <td>{q.status}</td>
                <td>
                  <Link href={`/dashboard/teacher/grading/${q.submissionId}`}>Calificar</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}