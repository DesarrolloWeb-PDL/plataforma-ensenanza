"use client";

import { useEffect, useRef, useState } from "react";

export interface CodeRunnerProps {
  html?: string;
  css?: string;
  js?: string;
  title?: string;
  height?: number;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Build the srcdoc for a sandboxed iframe.
 *
 * Security notes (limitations):
 * - The iframe uses `sandbox="allow-scripts"` WITHOUT `allow-same-origin`,
 *   so it runs in an opaque origin and cannot access the parent DOM/storage.
 * - A CSP meta tag blocks network, frames, and external resources.
 * - Execution is killed after `timeoutMs` (default 5s) by removing the iframe.
 * - This is a *best-effort* sandbox for educational previews, NOT a hardened
 *   isolation boundary. Do not use it to run untrusted code in production.
 */
export function buildSrcDoc(html: string, css: string, js: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none';" />
<style>${css}</style>
</head>
<body>
${html}
<script>
(function () {
  function send(type, args) {
    try {
      var out = [];
      for (var i = 0; i < args.length; i++) {
        try { out.push(String(args[i])); } catch (e) { out.push(""); }
      }
      window.parent.postMessage({ source: "coderunner", type: type, args: out }, "*");
    } catch (e) {}
  }
  var c = console;
  ["log", "info", "warn", "error"].forEach(function (m) {
    var orig = c[m] && c[m].bind ? c[m].bind(c) : function () {};
    c[m] = function () { send(m, arguments); orig.apply(c, arguments); };
  });
  window.addEventListener("error", function (e) { send("error", [e.message]); });
})();
${js}
</script>
</body>
</html>`;
}

export default function CodeRunner({
  html = "",
  css = "",
  js = "",
  title,
  height = 320,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: CodeRunnerProps) {
  const [runKey, setRunKey] = useState(0);
  const [killed, setKilled] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    setKilled(false);
    setTimedOut(false);
    setLogs([]);
    const timer = window.setTimeout(() => {
      setKilled(true);
      setTimedOut(true);
    }, timeoutMs);
    return () => window.clearTimeout(timer);
  }, [runKey, timeoutMs]);

  useEffect(() => {
    function handler(event: MessageEvent) {
      const data = event.data as { source?: string; type?: string; args?: unknown[] } | null;
      if (!data || data.source !== "coderunner") return;
      if (iframeRef.current && event.source && event.source !== iframeRef.current.contentWindow) return;
      const args = Array.isArray(data.args) ? data.args.map((a) => String(a)) : [];
      const line = `[${data.type ?? "log"}] ${args.join(" ")}`;
      setLogs((prev) => [...prev, line].slice(-100));
    }
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const srcdoc = killed ? "" : buildSrcDoc(html, css, js);

  return (
    <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, margin: "12px 0" }}>
      {title ? <h3 style={{ margin: "0 0 8px" }}>{title}</h3> : null}
      {killed ? (
        <div
          role="alert"
          style={{
            height,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#fee",
            color: "#900",
          }}
        >
          Execution stopped after {timeoutMs}ms (timeout).
        </div>
      ) : (
        <iframe
          ref={iframeRef}
          key={runKey}
          title={title ?? "Code runner"}
          srcDoc={srcdoc}
          sandbox="allow-scripts"
          style={{ width: "100%", height, border: "1px solid #ccc", borderRadius: 4 }}
        />
      )}
      <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
        <button type="button" onClick={() => setRunKey((k) => k + 1)}>
          Reset
        </button>
        {timedOut ? <span style={{ color: "#900" }}>Timed out.</span> : null}
      </div>
      {logs.length > 0 ? (
        <pre
          style={{
            marginTop: 8,
            maxHeight: 160,
            overflow: "auto",
            background: "#f6f6f6",
            padding: 8,
            fontSize: 12,
          }}
        >
          {logs.join("\n")}
        </pre>
      ) : null}
    </section>
  );
}
