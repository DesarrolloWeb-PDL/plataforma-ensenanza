"use client";

import { useState } from "react";

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

  return (
    <>
      <nav className="brutal-nav brutal-nav-desktop">
        {links.map((l) => (
          <a key={l.href} href={l.href}>{l.label}</a>
        ))}
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
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
            ))}
          </nav>
        </div>
      ) : null}
    </>
  );
}