"use client";

import { useEffect, useState } from "react";
import posthog from "posthog-js";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface ProgressButtonProps {
  kind: "lesson" | "level";
  id: string;
}

export default function ProgressButton({ kind, id }: ProgressButtonProps) {
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = window.localStorage.getItem("accessToken");
    if (!token) return;
    fetch(`${API_BASE}/api/v1/me/progress`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!json) return;
        const items = kind === "lesson" ? json.data?.lessons ?? [] : json.data?.levels ?? [];
        const done = items.some((item: { lessonId?: string; levelId?: string }) =>
          kind === "lesson" ? item.lessonId === id : item.levelId === id,
        );
        setCompleted(done);
      })
      .catch(() => undefined);
  }, [id, kind]);

  async function markComplete() {
    const token = window.localStorage.getItem("accessToken");
    if (!token) {
      setError("Inicia sesión para marcar progreso");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const endpoint = kind === "lesson" ? `lessons/${id}/complete` : `levels/${id}/complete`;
      const res = await fetch(`${API_BASE}/api/v1/${endpoint}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No se pudo marcar como completado");
      setCompleted(true);
      if (kind === "lesson") posthog.capture("lesson_completed", { lesson_id: id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  if (completed) {
    return <span className="badge">Completado</span>;
  }

  return (
    <div>
      <button type="button" onClick={markComplete} disabled={loading}>
        {loading ? "Guardando..." : "Marcar como completado"}
      </button>
      {error ? <p>{error}</p> : null}
    </div>
  );
}