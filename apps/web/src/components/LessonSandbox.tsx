"use client";

import { useState } from "react";

import CodeRunner from "@/components/CodeRunner";

export default function LessonSandbox() {
  const [html, setHtml] = useState("<h1>Hola</h1><p>Prueba el sandbox</p>");
  const [css, setCss] = useState("h1 { color: teal; }");
  const [js, setJs] = useState("console.log('Hola desde JS');");
  const [runKey, setRunKey] = useState(0);

  return (
    <section style={{ marginTop: "2rem" }}>
      <h2>Sandbox HTML/CSS/JS</h2>
      <p>Modificá el HTML, CSS y JS y presioná Ejecutar para ver el resultado.</p>
      <div style={{ display: "grid", gap: 8 }}>
        <label>
          HTML
          <textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={4} style={{ width: "100%" }} />
        </label>
        <label>
          CSS
          <textarea value={css} onChange={(e) => setCss(e.target.value)} rows={3} style={{ width: "100%" }} />
        </label>
        <label>
          JS
          <textarea value={js} onChange={(e) => setJs(e.target.value)} rows={4} style={{ width: "100%" }} />
        </label>
      </div>
      <button type="button" onClick={() => setRunKey((k) => k + 1)} style={{ marginTop: 8 }}>
        Ejecutar
      </button>
      <CodeRunner key={runKey} html={html} css={css} js={js} title="Preview" height={320} timeoutMs={60000} />
    </section>
  );
}