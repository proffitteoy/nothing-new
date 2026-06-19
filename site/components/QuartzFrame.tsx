"use client";

import { useState } from 'react';

export default function QuartzFrame({ src, title }: { src: string; title: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-10 pt-24 md:pt-28 relative z-10">
      <div className="relative rounded-3xl md:rounded-[40px] bg-white/55 dark:bg-slate-900/55 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-2xl overflow-hidden min-h-[78vh]">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/60 dark:bg-slate-900/60">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-black tracking-widest text-slate-500 dark:text-slate-400">
                正在载入 Quartz...
              </p>
            </div>
          </div>
        )}
        <iframe
          src={src}
          title={title}
          onLoad={() => setLoaded(true)}
          className="block w-full h-[78vh] md:h-[82vh] bg-white dark:bg-slate-950"
        />
      </div>
    </main>
  );
}
