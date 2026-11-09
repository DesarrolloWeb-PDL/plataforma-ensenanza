"use client";

import { useState } from "react";

import CodeRunner from "@/components/CodeRunner";
import { runJsInWorker } from "@/lib/sandboxWorker";

export default function SandboxPage() {
  const [html, setHtml] = useState("<h1>Hola</h1><p>Prueba el sandbox</p>");
  const [css, setCss] = useState("h1 { color: teal; }");
  const [js, setJs] = useState("console.log('Hola desde JS');");
  const [runKey, setRunKey] = useState(0);
  const [workerResult, setWorkerResult] = useState<string | null>(null);

  async function runWorker() {
    const res = await runJsInWorker(js);
    setWorkerResult(res.ok ? `OK: ${res.result}` : `Error: ${res.error}`);
  }

  return (
    <main>
      <h1>Sandbox de codigo</h1>
      <p>
        Vista previa aislada (iframe sandbox, sin same-origin, sin red, timeout 5s).
      </p>
      <div style={{ display: "grid", gap: 8 }}>
        <label>
          HTML
          <textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={6} style={{ width: "100%" }} />
        </label>
        <label>
          CSS
          <textarea value={css} onChange={(e) => setCss(e.target.value)} rows={4} style={{ width: "100%" }} />
        </label>
        <label>
          JS
          <textarea value={js} onChange={(e) => setJs(e.target.value)} rows={6} style={{ width: "100%" }} />
        </label>
      </div>
      <button type="button" onClick={() => setRunKey((k) => k + 1)}>
        Ejecutar
      </button>
      <button type="button" onClick={runWorker} style={{ marginLeft: 8 }}>
        Ejecutar JS en Worker
      </button>
      {workerResult ? <p>{workerResult}</p> : null}
      <CodeRunner key={runKey} html={html} css={css} js={js} title="Preview" />
    </main>
  );
}
