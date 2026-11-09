"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  version: number;
  status: string;
  payload: unknown;
  submittedAt: string;
  grade: { score: number; feedback: string; rubricScores: Record<string, unknown> } | null;
}

export default function GradingPage({ params }: { params: { submissionId: string } }) {
  const [token, setToken] = useState<string | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>("");
  const [rubricScores, setRubricScores] = useState<string>("{}");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = window.localStorage.getItem("accessToken");
    setToken(t);
    if (!t) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/submissions/${params.submissionId}`, {
          headers: { Authorization: `Bearer ${t}` },
        });
        if (!res.ok) throw new Error("No se pudo cargar el envío");
        const json = (await res.json()) as { data: Submission };
        setSubmission(json.data);
        if (json.data.grade) {
          setScore(json.data.grade.score);
          setFeedback(json.data.grade.feedback ?? "");
          setRubricScores(JSON.stringify(json.data.grade.rubricScores ?? {}, null, 2));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      }
    })();
  }, [params.submissionId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      let parsedRubric: Record<string, unknown> = {};
      try {
        parsedRubric = JSON.parse(rubricScores || "{}");
      } catch {
        throw new Error("rubricScores debe ser JSON válido");
      }
      const res = await fetch(`${API_BASE}/submissions/${params.submissionId}/grade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ score, feedback, rubricScores: parsedRubric }),
      });
      if (!res.ok) throw new Error("No se pudo guardar la calificación");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  }

  if (!token) return <main><p>Inicia sesión para calificar.</p></main>;
  if (!submission) return <main><p>{error ?? "Cargando..."}</p></main>;

  return (
    <main>
      <h1>Calificar envío</h1>
      {error ? <p>{error}</p> : null}
      {done ? <p>Calificación guardada.</p> : null}
      <section>
        <p>Envío: {submission.id}</p>
        <p>Estudiante: {submission.studentId}</p>
        <p>Estado: {submission.status}</p>
        <pre>{JSON.stringify(submission.payload, null, 2)}</pre>
      </section>
      <form onSubmit={handleSubmit}>
        <label>
          Puntaje
          <input type="number" value={score} onChange={(e) => setScore(Number(e.target.value))} />
        </label>
        <label>
          Retroalimentación
          <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        </label>
        <label>
          Rubric scores (JSON)
          <textarea value={rubricScores} onChange={(e) => setRubricScores(e.target.value)} />
        </label>
        <button type="submit" disabled={saving}>
          {saving ? "Guardando..." : "Guardar calificación"}
        </button>
      </form>
    </main>
  );
}