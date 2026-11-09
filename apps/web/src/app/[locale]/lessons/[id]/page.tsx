import { getTranslations, setRequestLocale } from "next-intl/server";

import CodeRunner from "@/components/CodeRunner";
import MdxContent from "@/components/MdxContent";
import ProgressButton from "@/components/ProgressButton";
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
  try {
    const res = await fetch(`${API_BASE}/lessons/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: Lesson };
    return json.data;
  } catch {
    return null;
  }
}

export default async function LessonPage({ params }: { params: { id: string; locale: string } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations("lessons");
  const lesson = await fetchLesson(params.id);
  if (!lesson) {
    return <main><h1>{t("notFound")}</h1></main>;
  }

  const { frontmatter, content } = loadContent(lesson.mdxRef);

  const isBlocks = lesson.trackId.includes("bloques") || lesson.mdxRef.includes("bloques");

  return (
    <main>
      <h1>{frontmatter.title ?? lesson.title}</h1>
      {frontmatter.description ? <p>{frontmatter.description}</p> : null}
      <ProgressButton kind="lesson" id={lesson.id} />
      <MdxContent source={content} />

      {isBlocks ? (
        <section style={{ marginTop: "2rem" }}>
          <h2>Sandbox de bloques</h2>
          <p>Practicá la consigna en el editor de Scratch. Si no carga, abrilo en una pestaña nueva.</p>
          <div style={{ border: "3px solid #000", boxShadow: "6px 6px 0 #000", overflow: "hidden" }}>
            <iframe
              src="/blockly-sandbox.html"
              title="Sandbox de bloques"
              width="100%"
              height="480"
              style={{ border: 0, display: "block" }}
            />
          </div>
          <p style={{ marginTop: "0.8rem" }}>
            <a href="https://scratch.mit.edu/projects/editor/" target="_blank" rel="noopener noreferrer" style={{ background: "var(--brutal-yellow)", padding: "0.4rem 0.8rem", border: "3px solid #000", boxShadow: "4px 4px 0 #000", fontWeight: 900, textTransform: "uppercase", textDecoration: "none", display: "inline-block" }}>
              Abrir en Scratch →
            </a>
          </p>
        </section>
      ) : (
        <section style={{ marginTop: "2rem" }}>
          <h2>Sandbox HTML/CSS/JS</h2>
          <p>Practicá la consigna en el editor. Modificá el HTML, CSS y JS y presioná Reset para ver el resultado.</p>
          <CodeRunner title="Editor HTML/CSS/JS" height={360} />
        </section>
      )}
    </main>
  );
}