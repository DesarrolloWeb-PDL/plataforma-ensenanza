"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface Badge {
  id: string;
  slug: string;
  name: string;
  criteria: unknown;
  trackId: string | null;
}

export default function BadgeList() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = window.localStorage.getItem("accessToken");
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/api/v1/me/badges`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!json) return;
        setBadges((json.data as Badge[]) ?? []);
      })
      .catch(() => setError("No se pudieron cargar las insignias"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Cargando insignias...</p>;
  if (error) return <p>{error}</p>;
  if (badges.length === 0) return <p>Sin insignias aun.</p>;

  return (
    <ul className="badge-list">
      {badges.map((badge) => (
        <li key={badge.id}>
          <strong>{badge.name}</strong> <span>({badge.slug})</span>
        </li>
      ))}
    </ul>
  );
}