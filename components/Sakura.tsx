"use client";

import { useEffect, useState } from 'react';

interface Petal {
  id: number;
  left: string;
  size: number;
  duration: number;
  delay: number;
}

const createPetals = (): Petal[] =>
  Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: 8 + Math.random() * 12,
    duration: 6 + Math.random() * 8,
    delay: Math.random() * -15,
  }));

export default function Sakura() {
  const [petals, setPetals] = useState<Petal[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => setPetals(createPetals()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-10 overflow-hidden">
      <style>{`
        @keyframes sakuraFall {
          0% { transform: translate(0, -10vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translate(15vw, 110vh) rotate(360deg); opacity: 0; }
        }
      `}</style>

      {petals.map((p) => (
        <div
          key={p.id}
          className="absolute top-0 bg-pink-300/70 shadow-[0_0_5px_rgba(255,182,193,0.6)]"
          style={{
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size * 1.2}px`,
            borderRadius: '100% 0 100% 0',
            animation: `sakuraFall ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
