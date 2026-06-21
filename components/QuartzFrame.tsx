"use client";

import { useState } from 'react';

export default function QuartzFrame({ src, title }: { src: string; title: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <main className="relative z-10 w-screen h-[100dvh] md:h-[calc(100dvh-4rem)] md:mt-16 overflow-hidden bg-white dark:bg-slate-950">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/80 dark:bg-slate-950/80">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-black tracking-widest text-slate-500 dark:text-slate-400">
              正在载入博客页面...
            </p>
          </div>
        </div>
      )}
      <iframe
        src={src}
        title={title}
        onLoad={() => setLoaded(true)}
        className="block w-full h-full border-0 bg-white dark:bg-slate-950"
      />
    </main>
  );
}
