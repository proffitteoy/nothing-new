"use client";

import { useState } from "react";

export default function QuartzFrame({ src, title }: { src: string; title: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <main className="relative z-10 h-[100dvh] w-screen overflow-hidden bg-white dark:bg-slate-950 md:mt-16 md:h-[calc(100dvh-4rem)]">
      {!loaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-slate-950/80">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
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
        className="block h-full w-full border-0 bg-white dark:bg-slate-950"
      />
    </main>
  );
}
