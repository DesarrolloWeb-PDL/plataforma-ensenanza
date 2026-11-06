"use client";

import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface Props {
  liveClassId: string;
  meetingUrl: string;
}

export default function LiveClassJoinButton({ liveClassId, meetingUrl }: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function join() {
    const token = window.localStorage.getItem("accessToken");
    if (!token) {
      setError("Inicia sesión para unirte a la clase");
      return;
    }
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/live-classes/${liveClassId}/attend`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No se pudo registrar la asistencia");
      const json = await res.json();
      setStatus(`Asistencia registrada: ${json.data.joinedAt}`);
      window.open(meetingUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={join} disabled={loading}>
        {loading ? "Uniéndose..." : "Unirse a la clase"}
      </button>
      {status ? <p>{status}</p> : null}
      {error ? <p>{error}</p> : null}
      <p>
        <a href={meetingUrl} target="_blank" rel="noreferrer">Abrir enlace de reunión</a>
      </p>
    </div>
  );
}