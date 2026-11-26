export const CORE_PALETTES = ["blue", "forest", "rose", "violet"] as const
export const PAGE_PALETTES = ["home", "projects", "anime", "chatter", "blog", "papers", "friends", "about"] as const
export type CorePalette = (typeof CORE_PALETTES)[number]
export type PagePalette = (typeof PAGE_PALETTES)[number]
export type PaletteSetting = CorePalette | "auto"

export const PALETTE_LOCK_KEY = "nothing-new:core-palette:fixed:v1"
export const PALETTE_SESSION_KEY = "nothing-new:core-palette:session:v1"
export const PALETTE_CHANGE_EVENT = "site-palette-change"

export function isCorePalette(value: unknown): value is CorePalette {
  return typeof value === "string" && (CORE_PALETTES as readonly string[]).includes(value)
}

export function pagePaletteForPath(pathname: string): PagePalette {
  const section = pathname.split("/")[1]
  return (PAGE_PALETTES as readonly string[]).includes(section) ? (section as PagePalette) : "home"
}

// Runs before the opening screen paints; no framework or asynchronous dependency.
export const paletteBootstrap = `
(function () {
  var root = document.documentElement;
  var cores = ${JSON.stringify(CORE_PALETTES)};
  var pages = ${JSON.stringify(PAGE_PALETTES)};
  var section = location.pathname.split("/")[1];
  root.dataset.pagePalette = pages.indexOf(section) >= 0 ? section : "home";
  root.dataset.corePalette = "blue";
  root.dataset.corePreference = "auto";
  try {
    var fixed = localStorage.getItem(${JSON.stringify(PALETTE_LOCK_KEY)});
    var saved = sessionStorage.getItem(${JSON.stringify(PALETTE_SESSION_KEY)});
    var valid = function (value) { return cores.indexOf(value) >= 0; };
    var core = valid(fixed) ? fixed : valid(saved) ? saved :
      (fixed !== null || saved !== null) ? "blue" : cores[Math.floor(Math.random() * cores.length)];
    sessionStorage.setItem(${JSON.stringify(PALETTE_SESSION_KEY)}, core);
    root.dataset.corePalette = core;
    root.dataset.corePreference = valid(fixed) ? fixed : "auto";
  } catch (_) {
    // Storage unavailable: keep blue.
  }
})();
`

export function readPaletteSetting(): PaletteSetting {
  const value = document.documentElement.dataset.corePreference
  return isCorePalette(value) ? value : "auto"
}

export function setPaletteSetting(setting: PaletteSetting): void {
  const root = document.documentElement
  try {
    let core: CorePalette
    if (setting === "auto") {
      localStorage.removeItem(PALETTE_LOCK_KEY)
      const choices = CORE_PALETTES.filter((value) => value !== root.dataset.corePalette)
      core = choices[Math.floor(Math.random() * choices.length)]
    } else {
      core = setting
      localStorage.setItem(PALETTE_LOCK_KEY, core)
    }
    sessionStorage.setItem(PALETTE_SESSION_KEY, core)
    root.dataset.corePalette = core
    root.dataset.corePreference = setting
  } catch {
    root.dataset.corePalette = "blue"
    root.dataset.corePreference = "auto"
  }
  window.dispatchEvent(new Event(PALETTE_CHANGE_EVENT))
}
