import Link from "next/link";
import { getTranslations } from "next-intl/server";

import ProgressButton from "@/components/ProgressButton";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface Level {
  id: string;
  trackId: string;
  order: number;
  title: string;
  projectTitle: string;
}

interface Lesson {
  id: string;
  trackId: string;
  levelId: string;
  order: number;
  title: string;
  mdxRef: string;
}

async function fetchLevel(id: string): Promise<Level | null> {
  const res = await fetch(`${API_BASE}/api/v1/levels/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as { data: Level };
  return json.data;
}

async function fetchLessons(id: string): Promise<Lesson[]> {
  const res = await fetch(`${API_BASE}/api/v1/levels/${id}/lessons`, { cache: "no-store" });
  if (!res.ok) return [];
  const json = (await res.json()) as { data: Lesson[] };
  return json.data;
}

export default async function LevelPage({ params }: { params: { levelId: string } }) {
  const t = await getTranslations("lessons");
  const level = await fetchLevel(params.levelId);
  if (!level) {
    return <main><h1>{t("notFound")}</h1></main>;
  }
  const lessons = await fetchLessons(params.levelId);

  return (
    <main>
      <h1>{level.title}</h1>
      <p>{level.projectTitle}</p>
      <ProgressButton kind="level" id={level.id} />
      <h2>{t("title")}</h2>
      <ul>
        {lessons.map((lesson) => (
          <li key={lesson.id}>
            <Link href={`/lessons/${lesson.id}`}>{lesson.title}</Link>
            <ProgressButton kind="lesson" id={lesson.id} />
          </li>
        ))}
      </ul>
    </main>
  );
}