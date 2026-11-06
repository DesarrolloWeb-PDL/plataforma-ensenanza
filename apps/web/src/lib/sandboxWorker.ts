// Optional Web Worker helper for running pure JavaScript without DOM access.
// Runs code in a blob-backed worker with a hard timeout. Client-side only.

export interface WorkerRunResult {
  ok: boolean;
  result?: string;
  error?: string;
}

export function runJsInWorker(code: string, timeoutMs = 5000): Promise<WorkerRunResult> {
  if (typeof window === "undefined" || typeof Worker === "undefined") {
    return Promise.resolve({ ok: false, error: "Web Workers not available" });
  }
  return new Promise<WorkerRunResult>((resolve) => {
    const workerSource = `
self.onmessage = function (e) {
  try {
    // eslint-disable-next-line no-eval
    var result = (0, eval)(e.data && e.data.code ? e.data.code : "");
    self.postMessage({ ok: true, result: String(result) });
  } catch (err) {
    self.postMessage({ ok: false, error: String(err && err.message ? err.message : err) });
  }
};
`;
    const blob = new Blob([workerSource], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve({ ok: false, error: "timeout" });
    }, timeoutMs);

    worker.onmessage = (event: MessageEvent) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      const data = event.data as WorkerRunResult | null;
      resolve(data ?? { ok: false, error: "no result" });
    };
    worker.onerror = (event: ErrorEvent) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve({ ok: false, error: event.message || "worker error" });
    };
    worker.postMessage({ code });
  });
}
