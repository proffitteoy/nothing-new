"use client";

import { useEffect, useState } from 'react';
import { siteConfig } from '../siteConfig';

interface DanmakuItem {
  id: number;
  text: string;
  top: number;
  duration: number;
  delay: number;
}

const createDanmakus = (): DanmakuItem[] => {
  const list = siteConfig.danmakuList || [];
  if (list.length === 0) return [];

  return Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    text: list[Math.floor(Math.random() * list.length)],
    top: Math.random() * 80 + 10,
    duration: Math.random() * 20 + 25,
    delay: Math.random() * 20,
  }));
};

export default function DanmakuBackground() {
  const [danmakus, setDanmakus] = useState<DanmakuItem[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDanmakus(createDanmakus()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="fixed top-28 h-[30vh] left-0 right-0 overflow-hidden pointer-events-none z-0">
      {danmakus.map((item) => (
        <div
          key={item.id}
          className="absolute whitespace-nowrap text-white/30 dark:text-white/10 font-bold text-lg tracking-wider select-none"
          style={{
            top: `${item.top}%`,
            right: '-100%',
            animation: `float-left ${item.duration}s linear ${item.delay}s infinite`,
          }}
        >
          {item.text}
        </div>
      ))}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes float-left {
          0% {
            right: -100%;
            transform: translateX(100%);
          }
          100% {
            right: 100%;
            transform: translateX(-100%);
          }
        }
      `}} />
    </div>
  );
}
