import assert from "node:assert/strict"
import test from "node:test"
import { runInNewContext } from "node:vm"
import { CORE_PALETTES, PAGE_PALETTES, PALETTE_SESSION_KEY, pagePaletteForPath, paletteBootstrap } from "./site-palette"

function storage(values = new Map<string, string>()) {
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  }
}

function boot(pathname: string, random: number, sessionStorage = storage()) {
  const dataset: Record<string, string> = {}
  runInNewContext(paletteBootstrap, {
    document: { documentElement: { dataset } },
    location: { pathname },
    sessionStorage,
    Math: { floor: Math.floor, random: () => random },
  })
  return dataset
}

test("eight page palettes follow the section, including nested notes", () => {
  for (const page of PAGE_PALETTES) {
    const route = page === "home" ? "/" : "/" + page + "/nested"
    assert.equal(pagePaletteForPath(route), page)
    assert.equal(boot(route, 0).pagePalette, page)
  }
  assert.equal(pagePaletteForPath("/unknown"), "home")
})

test("every core palette can be chosen; reload and direct navigation reuse it", () => {
  CORE_PALETTES.forEach((core, index) => {
    const session = storage()
    assert.equal(boot("/", (index + 0.5) / CORE_PALETTES.length, session).corePalette, core)
    assert.equal(boot("/papers", 0.99, session).corePalette, core)
    assert.equal(boot("/blog/notes", 0, session).corePalette, core)
  })
})

test("malformed session values are replaced; blocked storage falls back to blue", () => {
  const session = storage(new Map([[PALETTE_SESSION_KEY, "unknown"]]))
  assert.equal(boot("/", 0.99, session).corePalette, "violet")
  const blocked = { getItem: () => { throw Error("blocked") }, setItem: () => {} }
  const result = boot("/friends", 0.9, blocked)
  assert.equal(result.corePalette, "blue")
  assert.equal(result.pagePalette, "friends")
})
