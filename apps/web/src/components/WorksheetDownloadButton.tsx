"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface Props {
  worksheetId: string;
  label: string;
  suffix: "download" | "answer-key";
  teacherOnly?: boolean;
}

function getRole(): string | null {
  const token = window.localStorage.getItem("accessToken");
  if (!token) return null;
  try {
    const part = (token.split(".")[1] ?? "").replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(part));
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

export default function WorksheetDownloadButton({ worksheetId, label, suffix, teacherOnly }: Props) {
  const [visible, setVisible] = useState(!teacherOnly);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (teacherOnly) {
      const role = getRole();
      setVisible(role === "teacher" || role === "admin");
    }
  }, [teacherOnly]);

  if (!visible) return null;

  async function handleClick() {
    setLoading(true);
    setStatus(null);
    try {
      const token = window.localStorage.getItem("accessToken");
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/api/v1/worksheets/${worksheetId}/${suffix}`, { headers });
      if (!res.ok) throw new Error("No se pudo obtener el enlace de descarga");
      const json = (await res.json()) as { data: { url: string } };
      window.open(json.data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span>
      <button type="button" onClick={handleClick} disabled={loading}>
        {loading ? "Cargando..." : label}
      </button>
      {status ? <small> {status}</small> : null}
    </span>
  );
}