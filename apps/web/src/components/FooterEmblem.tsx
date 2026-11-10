"use client";

export default function FooterEmblem() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", justifyContent: "center", flexWrap: "wrap" }}>
      <a href="/" className="brutal-logo" style={{ textDecoration: "none" }}>
        <span className="brutal-squares">
          <span style={{ background: "var(--brutal-yellow)" }} />
          <span style={{ background: "var(--brutal-pink)" }} />
          <span style={{ background: "var(--brutal-cyan)" }} />
          <span style={{ background: "var(--brutal-green)" }} />
        </span>
        <span>DEV-PDL</span>
      </a>
      <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
        © {new Date().getFullYear()} DesarrolloWeb Academy — Paso de los Libres
      </span>
    </div>
  );
}