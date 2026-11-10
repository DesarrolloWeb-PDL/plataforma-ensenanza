"use client";

import { useState } from "react";

interface Question {
  q: string;
  options: string[];
  answer: number;
}

const QUIZZES: Record<string, Question[]> = {
  bloques: [
    { q: "¿Qué significa \"block\"?", options: ["Escenario", "Bloque", "Personaje"], answer: 1 },
    { q: "\"Green flag\" se traduce como:", options: ["Bandera verde", "Botón rojo", "Punto de partida"], answer: 0 },
    { q: "\"Sprite\" es:", options: ["Sonido", "Guión", "Personaje"], answer: 2 },
    { q: "Completá: \"The sprite __________ forward.\"", options: ["moves", "move", "moving"], answer: 0 },
  ],
  html5: [
    { q: "\"Tag\" significa:", options: ["Etiqueta", "Función", "Variable"], answer: 0 },
    { q: "\"Function\" se traduce como:", options: ["Clase", "Función", "Evento"], answer: 1 },
    { q: "\"Browser\" es:", options: ["Servidor", "Navegador", "Estilo"], answer: 1 },
    { q: "Traducí: \"Add a new attribute to the link.\"", options: [
      "Agregá un nuevo atributo al enlace.",
      "Agregá un nuevo botón al enlace.",
      "Borrá el atributo del enlace.",
    ], answer: 0 },
  ],
};

export default function Quiz({ quizId }: { quizId: string }) {
  const questions = QUIZZES[quizId] ?? [];
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  if (questions.length === 0) return null;

  function submit() {
    setSubmitted(true);
  }

  function reset() {
    setSelected({});
    setSubmitted(false);
  }

  const score = submitted
    ? questions.reduce((acc, q, i) => acc + (selected[i] === q.answer ? 1 : 0), 0)
    : 0;

  return (
    <section style={{ marginTop: "2rem" }}>
      <h2>Quiz interactivo</h2>
      <div style={{ display: "grid", gap: "1.2rem" }}>
        {questions.map((q, i) => (
          <div key={i} className="brutal-card">
            <p style={{ fontWeight: 900, marginBottom: "0.6rem" }}>{i + 1}. {q.q}</p>
            <div style={{ display: "grid", gap: "0.4rem" }}>
              {q.options.map((opt, j) => {
                const isCorrect = j === q.answer;
                const chosen = selected[i] === j;
                let background = "#fff";
                if (submitted && isCorrect) background = "#4ade80";
                else if (submitted && chosen && !isCorrect) background = "#f87171";
                else if (chosen) background = "var(--brutal-yellow)";
                return (
                  <label
                    key={j}
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      alignItems: "center",
                      border: "3px solid #000",
                      padding: "0.5rem 0.7rem",
                      background,
                      cursor: submitted ? "default" : "pointer",
                      fontWeight: 700,
                    }}
                  >
                    <input
                      type="radio"
                      name={`q-${i}`}
                      disabled={submitted}
                      checked={chosen}
                      onChange={() => setSelected((s) => ({ ...s, [i]: j }))}
                    />
                    {opt}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "1rem", display: "flex", gap: "0.8rem", alignItems: "center" }}>
        {!submitted ? (
          <button type="button" onClick={submit}>Corregir</button>
        ) : (
          <>
            <button type="button" onClick={reset}>Reintentar</button>
            <strong style={{ fontSize: "1.2rem" }}>
              Puntaje: {score} / {questions.length}
            </strong>
          </>
        )}
      </div>
    </section>
  );
}