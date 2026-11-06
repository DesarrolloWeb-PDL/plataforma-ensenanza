"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface XpSummary {
  userId: string;
  totalXp: number;
}

export default function XpDisplay() {
  const [xp, setXp] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = window.localStorage.getItem("accessToken");
    if (!token) return;
    fetch(`${API_BASE}/api/v1/me/xp`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!json) return;
        const data = json.data as XpSummary;
        setXp(data.totalXp);
      })
      .catch(() => setError("No se pudo cargar la experiencia"));
  }, []);

  if (error) return <p>{error}</p>;
  if (xp === null) return <p>Cargando XP...</p>;
  return <div className="xp-display">XP total: {xp}</div>;
}