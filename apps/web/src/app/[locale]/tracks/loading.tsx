export default function Loading() {
  return (
    <main style={{ padding: "2rem 1.5rem" }}>
      <h1>Cargando tracks…</h1>
      <p style={{ fontWeight: 600 }}>Esto puede tardar unos segundos si la API está despertando.</p>
      <div style={{ display: "grid", gap: "1rem", marginTop: "1.5rem" }}>
        {[1, 2].map((i) => (
          <div key={i} style={{ border: "3px solid #000", background: "#fff", padding: "1.5rem", boxShadow: "6px 6px 0 #000" }}>
            <div style={{ height: "1.5rem", width: "60%", background: "#fef3c7", marginBottom: "0.5rem" }} />
            <div style={{ height: "1rem", width: "80%", background: "#fef9c3" }} />
          </div>
        ))}
      </div>
    </main>
  );
}