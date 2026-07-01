"use client";

import { useEffect, useState } from 'react';

interface WeatherParticle {
  id: number;
  left: string;
  duration: string;
  delay: string;
  opacity: number;
  size: number;
}

const createParticles = (): WeatherParticle[] =>
  Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    duration: `${Math.random() * 15 + 10}s`,
    delay: `${Math.random() * -20}s`,
    opacity: Math.random() * 0.5 + 0.1,
    size: Math.random() * 3 + 2,
  }));

export default function WeatherEffect() {
  const [particles, setParticles] = useState<WeatherParticle[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => setParticles(createParticles()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <style>{`
        @keyframes float-down {
          0% { transform: translateY(-10vh) translateX(0) scale(0.8); }
          50% { transform: translateY(50vh) translateX(20px) scale(1.2); }
          100% { transform: translateY(110vh) translateX(-10px) scale(0.8); }
        }
        .cyber-particle {
          position: absolute;
          top: -10vh;
          background: #ffffff;
          border-radius: 50%;
          animation: float-down linear infinite;
          filter: blur(1px);
        }
        .dark .cyber-particle {
           background: rgba(165, 180, 252, 0.8);
           box-shadow: 0 0 10px 2px rgba(99, 102, 241, 0.3);
        }
      `}</style>
      {particles.map((p) => (
        <div
          key={p.id}
          className="cyber-particle"
          style={{
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: p.duration,
            animationDelay: p.delay,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
}
