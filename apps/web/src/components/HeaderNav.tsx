"use client";

import { useState } from "react";

const links = [
  { href: "/tracks", label: "Tracks" },
  { href: "/resources", label: "Recursos" },
  { href: "/stats", label: "Stats" },
  { href: "/sandbox", label: "Sandbox" },
  { href: "/gamification", label: "XP" },
];

const langs = [
  { href: "/", label: "ES" },
  { href: "/en", label: "EN" },
  { href: "/pt", label: "PT" },
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
      <div className="brutal-lang brutal-lang-desktop">
        {langs.map((l) => (
          <a key={l.href} href={l.href}>{l.label}</a>
        ))}
      </div>

      <button
        type="button"
        className="brutal-hamburger"
        aria-label="Menú"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>

      {open ? (
        <div className="brutal-mobile-menu">
          <nav className="brutal-nav-mobile">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
            ))}
          </nav>
          <div className="brutal-lang-mobile">
            {langs.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}