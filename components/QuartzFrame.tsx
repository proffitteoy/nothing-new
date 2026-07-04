"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    __quartzBlogFrame?: HTMLIFrameElement;
    __quartzBlogLoaded?: boolean;
    __quartzBlogDock?: (target?: HTMLElement | null, visible?: boolean) => void;
  }
}

export default function QuartzFrame({ src, title }: { src: string; title: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const fallbackStartedRef = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const [useFallbackFrame, setUseFallbackFrame] = useState(src !== "/blog/index.html");

  useEffect(() => {
    if (src !== "/blog/index.html") return;

    let docked = false;
    let disposed = false;

    const showPreloadedFrame = () => {
      if (mountRef.current) {
        window.__quartzBlogDock?.(mountRef.current, true);
      }
    };
    const markLoaded = () => {
      setLoaded(true);
      showPreloadedFrame();
    };
    const attachPreloadedFrame = () => {
      if (disposed || fallbackStartedRef.current || !mountRef.current || !window.__quartzBlogDock) {
        return false;
      }

      window.__quartzBlogDock(mountRef.current, Boolean(window.__quartzBlogLoaded));
      docked = true;
      if (window.__quartzBlogLoaded) {
        markLoaded();
      }
      return true;
    };

    window.addEventListener("quartz-blog-ready", attachPreloadedFrame);
    window.addEventListener("quartz-blog-loaded", markLoaded);

    attachPreloadedFrame();

    const fallbackTimer = window.setTimeout(() => {
      if (!docked && !disposed) {
        fallbackStartedRef.current = true;
        setUseFallbackFrame(true);
      }
    }, 600);

    return () => {
      disposed = true;
      window.clearTimeout(fallbackTimer);
      window.removeEventListener("quartz-blog-ready", attachPreloadedFrame);
      window.removeEventListener("quartz-blog-loaded", markLoaded);
      if (docked) {
        window.__quartzBlogDock?.(null);
      }
    };
  }, [src]);

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

      {useFallbackFrame ? (
        <iframe
          src={src}
          title={title}
          onLoad={() => setLoaded(true)}
          className="block h-full w-full border-0 bg-white dark:bg-slate-950"
        />
      ) : (
        <div ref={mountRef} className="h-full w-full" />
      )}
    </main>
  );
}
