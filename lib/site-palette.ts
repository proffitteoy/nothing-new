export const CORE_PALETTES = ["blue", "forest", "rose", "violet"] as const
export const PAGE_PALETTES = ["home", "projects", "anime", "chatter", "blog", "papers", "friends", "about"] as const

export type PagePalette = (typeof PAGE_PALETTES)[number]
export const PALETTE_SESSION_KEY = "nothing-new:core-palette:session:v1"

export function pagePaletteForPath(pathname: string): PagePalette {
  const section = pathname.split("/")[1]
  return (PAGE_PALETTES as readonly string[]).includes(section) ? (section as PagePalette) : "home"
}

// Before the first paint: select once per browser tab session. No controls,
// persistent preference, new component or server rendering dependency.
export const paletteBootstrap = `
(function () {
  var root = document.documentElement;
  var pages = ${JSON.stringify(PAGE_PALETTES)};
  var cores = ${JSON.stringify(CORE_PALETTES)};
  var section = location.pathname.split("/")[1];
  root.dataset.pagePalette = pages.indexOf(section) >= 0 ? section : "home";
  root.dataset.corePalette = "blue";
  try {
    var saved = sessionStorage.getItem(${JSON.stringify(PALETTE_SESSION_KEY)});
    var core = cores.indexOf(saved) >= 0 ? saved : cores[Math.floor(Math.random() * cores.length)];
    sessionStorage.setItem(${JSON.stringify(PALETTE_SESSION_KEY)}, core);
    root.dataset.corePalette = core;
  } catch (_) {
    // Storage unavailable: use the complete blue fallback.
  }
})();
`
