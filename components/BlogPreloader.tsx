"use client";

import { useEffect, useRef } from "react";

const BLOG_HOME = "/blog/index.html";
const HIDDEN_FRAME_CLASS =
  "fixed left-0 top-0 h-px w-px -translate-x-full overflow-hidden border-0 opacity-0 pointer-events-none";
const VISIBLE_FRAME_CLASS = "block h-full w-full border-0 bg-white dark:bg-slate-950";

declare global {
  interface Window {
    __quartzBlogFrame?: HTMLIFrameElement;
    __quartzBlogLoaded?: boolean;
    __quartzBlogDock?: (target?: HTMLElement | null, visible?: boolean) => void;
  }
}

export default function BlogPreloader() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let frame = window.__quartzBlogFrame;

    if (!frame) {
      frame = document.createElement("iframe");
      frame.src = BLOG_HOME;
      frame.title = "Quartz 博客预加载";
      frame.loading = "eager";
      frame.referrerPolicy = "same-origin";
      frame.tabIndex = -1;
      frame.className = HIDDEN_FRAME_CLASS;
      frame.setAttribute("aria-hidden", "true");
      frame.addEventListener("load", () => {
        window.__quartzBlogLoaded = true;
        window.dispatchEvent(new Event("quartz-blog-loaded"));
      });

      window.__quartzBlogFrame = frame;
      window.__quartzBlogLoaded = false;
    }

    window.__quartzBlogDock = (target?: HTMLElement | null, visible = false) => {
      const dockTarget = target ?? host;
      if (!window.__quartzBlogFrame || !dockTarget) return;

      window.__quartzBlogFrame.className = target && visible ? VISIBLE_FRAME_CLASS : HIDDEN_FRAME_CLASS;
      if (target && visible) {
        window.__quartzBlogFrame.removeAttribute("aria-hidden");
      } else {
        window.__quartzBlogFrame.setAttribute("aria-hidden", "true");
      }
      dockTarget.appendChild(window.__quartzBlogFrame);
    };

    window.__quartzBlogDock(null);
    window.dispatchEvent(new Event("quartz-blog-ready"));

    return () => {
      if (window.__quartzBlogFrame?.parentElement === host) {
        window.__quartzBlogFrame.remove();
      }
      window.__quartzBlogDock = undefined;
    };
  }, []);

  return <div ref={hostRef} aria-hidden="true" className="contents" />;
}
