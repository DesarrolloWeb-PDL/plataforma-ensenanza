import { getTranslations } from "next-intl/server";

export default async function ResourcesPage() {
  const t = await getTranslations("resources");

  const sections = [
    {
      title: "Descargas (material propio)",
      items: [
        { name: "Programa Pilas y Bloques — Módulo 1 (PDF)", url: "/materials/programa-pbe-1.pdf" },
        { name: "Programación Web — Hoja de ruta (PDF)", url: "/materials/hoja-de-ruta-programacion-web.pdf" },
        { name: "Programación Web — Módulo 2 (PDF)", url: "/materials/programacion-web-modulo-2.pdf" },
        { name: "Programación Web — Módulo 3 (PDF)", url: "/materials/programacion-web-modulo-3.pdf" },
        { name: "ScratchJr — Bloques (PDF)", url: "/materials/scratchjr-blocks.pdf" },
      ],
    },
    {
      title: "Cheat sheets de programación",
      items: [
        { name: "Coddy — Cheat Sheets (HTML, CSS, JS, Python, SQL...)", url: "https://coddy.tech/cheat-sheets" },
        { name: "EbookFoundation — Free Programming Cheat Sheets (GitHub)", url: "https://github.com/EbookFoundation/free-programming-books/blob/main/more/free-programming-cheatsheets.md" },
      ],
    },
    {
      title: "Libros y cursos gratis",
      items: [
        { name: "freeCodeCamp (es/en)", url: "https://www.freecodecamp.org/espanol/" },
        { name: "Code.org (bloques y cursos)", url: "https://code.org/" },
        { name: "Scratch (programación por bloques)", url: "https://scratch.mit.edu/" },
        { name: "El gran libro de HTML5, CSS3 y JavaScript (recomendado)", url: "https://www.google.com/search?q=el+gran+libro+de+html5+css3+y+javascript" },
      ],
    },
    {
      title: "Práctica y juegos",
      items: [
        { name: "Coddy — Playground y arcade", url: "https://coddy.tech/" },
        { name: "Hour of Code", url: "https://hourofcode.com/" },
      ],
    },
  ];

  return (
    <main>
      <h1>{t("title")}</h1>
      <p>{t("subtitle")}</p>
      {sections.map((s) => (
        <section key={s.title}>
          <h2>{s.title}</h2>
          <ul>
            {s.items.map((it) => (
              <li key={it.url}>
                <a href={it.url} target="_blank" rel="noopener noreferrer">{it.name}</a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}