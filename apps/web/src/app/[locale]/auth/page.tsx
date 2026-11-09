"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function AuthPage() {
  const t = useTranslations("auth");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const body =
        mode === "login"
          ? { email, password }
          : { email, password, name, role: "student" };
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { data?: { accessToken: string; refreshToken: string }; error?: { message?: string } };
      if (!res.ok || !json.data) {
        throw new Error(json.error?.message ?? "No se pudo autenticar");
      }
      window.localStorage.setItem("accessToken", json.data.accessToken);
      window.localStorage.setItem("refreshToken", json.data.refreshToken);
      window.location.href = "/tracks";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>{mode === "login" ? t("login") : t("register")}</h1>
      <form onSubmit={submit} style={{ display: "grid", gap: "1rem", maxWidth: 420 }}>
        {mode === "register" ? (
          <label>
            {t("name")}
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
        ) : null}
        <label>
          {t("email")}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          {t("password")}
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </label>
        {error ? <p style={{ color: "#900", fontWeight: 700 }}>{error}</p> : null}
        <button type="submit" disabled={loading}>
          {loading ? t("loading") : mode === "login" ? t("submitLogin") : t("submitRegister")}
        </button>
      </form>
      <p style={{ marginTop: "1rem" }}>
        {mode === "login" ? t("noAccount") : t("hasAccount")}{" "}
        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          style={{ background: "none", border: "none", boxShadow: "none", padding: 0, textDecoration: "underline", cursor: "pointer" }}
        >
          {mode === "login" ? t("signup") : t("signin")}
        </button>
      </p>
    </main>
  );
}