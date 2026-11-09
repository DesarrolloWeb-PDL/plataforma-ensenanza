import { getTranslations } from "next-intl/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface Stats {
  users: number;
  tracks: number;
  levels: number;
  lessons: number;
  assignments: number;
  submissions: number;
  worksheets: number;
  badges: number;
}

async function fetchStats(): Promise<Stats | null> {
  try {
    const res = await fetch(`${API_BASE}/public/stats`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: Stats };
    return json.data;
  } catch {
    return null;
  }
}

export default async function StatsPage() {
  const t = await getTranslations("stats");
  const stats = await fetchStats();

  if (!stats) {
    return <main><p>{t("error")}</p></main>;
  }

  const items = [
    { label: t("users"), value: stats.users },
    { label: t("tracks"), value: stats.tracks },
    { label: t("levels"), value: stats.levels },
    { label: t("lessons"), value: stats.lessons },
    { label: t("assignments"), value: stats.assignments },
    { label: t("submissions"), value: stats.submissions },
    { label: t("worksheets"), value: stats.worksheets },
    { label: t("badges"), value: stats.badges },
  ];

  return (
    <main>
      <h1>{t("title")}</h1>
      <p>{t("subtitle")}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
        {items.map((it) => (
          <div key={it.label} style={{ border: "3px solid #000", background: "#fff", padding: "1.2rem", boxShadow: "6px 6px 0 #000", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: 900 }}>{it.value}</div>
            <div style={{ fontWeight: 700, textTransform: "uppercase", fontSize: "0.85rem" }}>{it.label}</div>
          </div>
        ))}
      </div>
    </main>
  );
}