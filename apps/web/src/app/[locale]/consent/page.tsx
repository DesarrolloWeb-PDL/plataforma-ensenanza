"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface ConsentStatus {
  userId: string;
  consentStatus: string;
  parentUserId: string | null;
  links: { parentId: string; childId: string; consentedAt: string | null; revokedAt: string | null }[];
}

export default function ConsentPage() {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<ConsentStatus | null>(null);
  const [parentId, setParentId] = useState("");
  const [childId, setChildId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const t = window.localStorage.getItem("accessToken");
    setToken(t);
    if (!t) return;
    fetch(`${API_BASE}/api/v1/consent/status`, {
      headers: { Authorization: `Bearer ${t}` },
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json) setStatus(json.data as ConsentStatus);
      })
      .catch(() => undefined);
  }, []);

  async function call(path: string, body: unknown) {
    if (!token) {
      setError("Inicia sesion");
      return;
    }
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error?.message ?? "Error");
      }
      setMessage("Operacion realizada");
      const r = await fetch(`${API_BASE}/api/v1/consent/status`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (r.ok) setStatus((await r.json()).data as ConsentStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  }

  if (!token) return <main><p>Inicia sesion para gestionar consentimiento.</p></main>;

  return (
    <main>
      <h1>Consentimiento parental</h1>
      {error ? <p>{error}</p> : null}
      {message ? <p>{message}</p> : null}

      <section>
        <h2>Vincular menor</h2>
        <input placeholder="Parent ID" value={parentId} onChange={(e) => setParentId(e.target.value)} />
        <input placeholder="Child ID" value={childId} onChange={(e) => setChildId(e.target.value)} />
        <button type="button" onClick={() => call("/consent/link", { parentId, childId, granted: true })}>
          Vincular
        </button>
      </section>

      <section>
        <h2>Otorgar / Revocar</h2>
        <button type="button" onClick={() => call("/consent/grant", { parentId, childId })}>
          Otorgar
        </button>
        <button type="button" onClick={() => call("/consent/revoke", { parentId, childId })}>
          Revocar
        </button>
      </section>

      <section>
        <h2>Estado</h2>
        {status ? (
          <div>
            <p>Usuario: {status.userId}</p>
            <p>Estado: {status.consentStatus}</p>
            <p>Padre vinculado: {status.parentUserId ?? "ninguno"}</p>
            <ul>
              {status.links.map((l, i) => (
                <li key={i}>
                  padre {l.parentId} - hijo {l.childId} (otorgado: {l.consentedAt ?? "no"}, revocado: {l.revokedAt ?? "no"})
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p>Sin datos</p>
        )}
      </section>
    </main>
  );
}