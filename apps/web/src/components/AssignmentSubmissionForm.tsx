"use client";

import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface Props {
  assignmentId: string;
  type: string;
}

export default function AssignmentSubmissionForm({ assignmentId, type }: Props) {
  const [content, setContent] = useState("");
  const [fileKey, setFileKey] = useState("");
  const [answers, setAnswers] = useState("");
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const token = window.localStorage.getItem("accessToken");
    if (!token) {
      setError("Inicia sesión para enviar la tarea");
      return;
    }
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      let resolvedFileKey = fileKey;
      if (type === "file" && fileName) {
        const upRes = await fetch(`${API_BASE}/api/v1/storage/signed-upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ contentType: "application/octet-stream" }),
        });
        if (upRes.ok) {
          const upJson = await upRes.json();
          resolvedFileKey = upJson.data.key;
          const fileInput = document.getElementById("submission-file") as HTMLInputElement | null;
          const file = fileInput?.files?.[0];
          if (file) {
            await fetch(upJson.data.url, { method: "PUT", body: file }).catch(() => undefined);
          }
        }
      }

      const body: Record<string, unknown> = { type };
      if (type === "code") body.content = content;
      if (type === "file") body.fileKey = resolvedFileKey || fileName;
      if (type === "quiz") body.answers = answers.split("\n").filter(Boolean);

      const res = await fetch(`${API_BASE}/api/v1/assignments/${assignmentId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("No se pudo enviar la tarea");
      const json = await res.json();
      setStatus(`Enviado (versión ${json.data.version})`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit}>
      {type === "code" ? (
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10} cols={60} />
      ) : null}
      {type === "file" ? (
        <div>
          <input id="submission-file" type="file" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} />
          <input value={fileKey} onChange={(e) => setFileKey(e.target.value)} placeholder="fileKey (opcional)" />
        </div>
      ) : null}
      {type === "quiz" ? (
        <textarea value={answers} onChange={(e) => setAnswers(e.target.value)} rows={8} cols={60} placeholder="Una respuesta por línea" />
      ) : null}
      <button type="submit" disabled={loading}>
        {loading ? "Enviando..." : "Enviar"}
      </button>
      {status ? <p>{status}</p> : null}
      {error ? <p>{error}</p> : null}
    </form>
  );
}