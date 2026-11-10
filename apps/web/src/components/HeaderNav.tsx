"use client";

import { useEffect, useState } from "react";

const links = [
  { href: "/tracks", label: "Tracks" },
  { href: "/resources", label: "Recursos" },
  { href: "/stats", label: "Stats" },
  { href: "/sandbox", label: "Sandbox" },
  { href: "/gamification", label: "XP" },
  { href: "/auth", label: "Entrar" },
];

export default function HeaderNav() {
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const token = window.localStorage.getItem("accessToken");
    const r = window.localStorage.getItem("userRole");
    setAuthed(!!token);
    setRole(r);
  }, []);

  const roleLinks =
    role === "admin"
      ? [{ href: "/admin", label: "Admin" }, { href: "/teacher", label: "Docente" }]
      : role === "teacher"
        ? [{ href: "/teacher", label: "Docente" }]
        : [];

  const visibleLinks = authed ? [...links, ...roleLinks] : links.filter((l) => l.href === "/auth");

  function logout() {
    window.localStorage.removeItem("accessToken");
    window.localStorage.removeItem("refreshToken");
    window.localStorage.removeItem("userRole");
    window.location.href = "/";
  }

  return (
    <>
      <nav className="brutal-nav brutal-nav-desktop">
        {visibleLinks.map((l) => (
          <a key={l.href} href={l.href}>{l.label}</a>
        ))}
        {authed ? (
          <a href="#" onClick={(e) => { e.preventDefault(); logout(); }}>Salir</a>
        ) : null}
      </nav>

      <button
        type="button"
        className="brutal-hamburger"
        aria-label="Menú"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
          <rect x="2" y="4" width="28" height="6" fill="var(--brutal-yellow)" stroke="#000" strokeWidth="2" />
          <rect x="2" y="11" width="28" height="3" fill="var(--brutal-green)" stroke="#000" strokeWidth="2" />
          <rect x="2" y="15" width="28" height="6" fill="#3f2a1a" stroke="#000" strokeWidth="2" />
          <rect x="2" y="22" width="28" height="6" fill="var(--brutal-yellow)" stroke="#000" strokeWidth="2" />
        </svg>
      </button>

      {open ? (
        <div className="brutal-mobile-menu">
          <nav className="brutal-nav-mobile">
            {visibleLinks.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
            ))}
            {authed ? (
              <a href="#" onClick={(e) => { e.preventDefault(); logout(); }}>Salir</a>
            ) : null}
          </nav>
        </div>
      ) : null}
    </>
  );
}