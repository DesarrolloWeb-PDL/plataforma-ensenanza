import { getTranslations } from "next-intl/server";

import MdxContent from "@/components/MdxContent";
import { loadContent } from "@/lib/content";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface Lesson {
  id: string;
  trackId: string;
  levelId: string;
  order: number;
  title: string;
  mdxRef: string;
}

async function fetchLesson(id: string): Promise<Lesson | null> {
  const res = await fetch(`${API_BASE}/api/v1/lessons/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as { data: Lesson };
  return json.data;
}

export default async function LessonPage({ params }: { params: { id: string } }) {
  const t = await getTranslations("lessons");
  const lesson = await fetchLesson(params.id);
  if (!lesson) {
    return <main><h1>{t("notFound")}</h1></main>;
  }

  const { frontmatter, content } = loadContent(lesson.mdxRef);

  return (
    <main>
      <h1>{frontmatter.title ?? lesson.title}</h1>
      {frontmatter.description ? <p>{frontmatter.description}</p> : null}
      <MdxContent source={content} />
    </main>
  );
}