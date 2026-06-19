"use client";
import { useEffect, useState } from 'react';

interface Petal {
  id: number;
  left: string;
  size: number;
  duration: number;
  delay: number;
}

export default function Sakura() {
  const [petals, setPetals] = useState<Petal[]>([]);

  useEffect(() => {
    const generated = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: 8 + Math.random() * 12, // 8px 到 20px 大小的花瓣
      duration: 6 + Math.random() * 8, // 飘落时间 6-14 秒
      delay: Math.random() * -15, // 随机错开下落时间
    }));
    setPetals(generated);
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

      {petals.map(p => (
        <div
          key={p.id}
          className="absolute top-0 bg-pink-300/70 shadow-[0_0_5px_rgba(255,182,193,0.6)]"
          style={{
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size * 1.2}px`,
            // 樱花特有的圆角形状
            borderRadius: '100% 0 100% 0',
            animation: `sakuraFall ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
          }}
        ></div>
      ))}
    </div>
  );
}