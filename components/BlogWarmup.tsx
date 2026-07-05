"use client";

import { useEffect } from "react";

const PREFETCH_TARGETS = [
  { href: "/blog/index.html", as: "document" },
  { href: "/blog/misc/index.html", as: "document" },
  { href: "/blog/index.css", as: "style" },
  { href: "/blog/prescript.js", as: "script" },
  { href: "/blog/postscript.js", as: "script" },
  { href: "/blog/static/contentIndex.json", as: "fetch" },
] as const;

function appendPrefetchLink(href: string, as: string) {
  if (document.head.querySelector(`link[rel="prefetch"][href="${href}"]`)) {
    return;
  }

  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = href;
  link.as = as;
  if (as === "fetch") {
    link.crossOrigin = "anonymous";
  }
  document.head.appendChild(link);
}

export default function BlogWarmup() {
  useEffect(() => {
    const warmup = () => {
      for (const target of PREFETCH_TARGETS) {
        appendPrefetchLink(target.href, target.as);
      }
    };

    const requestIdleCallback = window.requestIdleCallback ?? ((callback) => window.setTimeout(callback, 1000));
    const cancelIdleCallback = window.cancelIdleCallback ?? window.clearTimeout;
    const idleId = requestIdleCallback(warmup);

    return () => cancelIdleCallback(idleId);
  }, []);

  return null;
}
