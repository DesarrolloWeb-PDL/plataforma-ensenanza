"use client";

import { useState } from "react";

import BadgeList from "@/components/BadgeList";
import XpDisplay from "@/components/XpDisplay";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function GamificationPage() {
  const [streak, setStreak] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkIn() {
    const token = window.localStorage.getItem("accessToken");
    if (!token) {
      setError("Inicia sesion para registrar racha");
      return;
    }
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/me/streak/check-in`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No se pudo registrar la racha");
      const json = (await res.json()) as { data: { current: number } };
      setStreak(json.data.current);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  }

  return (
    <main>
      <h1>Gamificacion</h1>
      <section>
        <h2>Experiencia</h2>
        <XpDisplay />
      </section>
      <section>
        <h2>Racha</h2>
        <button type="button" onClick={checkIn}>
          Registrar racha diaria
        </button>
        {streak !== null ? <p>Racha actual: {streak} dias</p> : null}
        {error ? <p>{error}</p> : null}
      </section>
      <section>
        <h2>Insignias</h2>
        <BadgeList />
      </section>
    </main>
  );
}