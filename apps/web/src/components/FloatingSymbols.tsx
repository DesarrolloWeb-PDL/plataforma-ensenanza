"use client";

import { useEffect, useState } from "react";

interface Symbol {
  id: number;
  char: string;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
}

const CHARS = [
  "<", ">", "{", "}", "/", "=", "+", ";", "&", "*",
  "◆", "●", "▲", "■", "✦", "▶",
  "🤖", "💻", "⭐", "❤️", "🚀", "📚", "⚡", "💡", "🎯", "🎮",
  "⟨", "⟩", "∑", "π", "λ", "∞", "✓", "✗", "→", "←",
];
const COLORS = ["#facc15", "#f472b6", "#22d3ee", "#4ade80", "#a78bfa", "#fb923c", "#000000"];

function createSymbol(id: number): Symbol {
  return {
    id,
    char: CHARS[Math.floor(Math.random() * CHARS.length)]!,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    duration: Math.random() * 10 + 8,
    delay: Math.random() * 5,
    color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
  };
}

export default function FloatingSymbols() {
  const [symbols, setSymbols] = useState<Symbol[]>([]);

  useEffect(() => {
    const initial = Array.from({ length: 30 }, (_, i) => createSymbol(i));
    setSymbols(initial);
    const interval = setInterval(() => {
      setSymbols((prev) =>
        prev.map((s) =>
          Math.random() > 0.85
            ? { ...createSymbol(s.id) }
            : { ...s, color: COLORS[Math.floor(Math.random() * COLORS.length)]! }
        )
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: -1 }}>
      {symbols.map((s) => (
        <span
          key={s.id}
          style={{
            position: "absolute",
            left: `${s.x}%`,
            top: `${s.y}%`,
            fontSize: `${s.size}rem`,
            fontWeight: 900,
            color: s.color,
            opacity: 0.4,
            animation: `floatSymbol ${s.duration}s ease-in-out ${s.delay}s infinite`,
            transition: "color 1.5s ease",
          }}
        >
          {s.char}
        </span>
      ))}
      <style jsx global>{`
        @keyframes floatSymbol {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.25; }
          50% { transform: translateY(-30px) rotate(20deg); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}