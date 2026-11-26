import assert from "node:assert/strict"
import test from "node:test"
import { runInNewContext } from "node:vm"
import {
  CORE_PALETTES,
  PAGE_PALETTES,
  PALETTE_LOCK_KEY,
  PALETTE_SESSION_KEY,
  pagePaletteForPath,
  paletteBootstrap,
} from "./site-palette"

function storage(values = new Map<string, string>()) {
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  }
}

function boot(pathname: string, random: number, sessionStorage = storage(), localStorage = storage()) {
  const dataset: Record<string, string> = {}
  runInNewContext(paletteBootstrap, {
    document: { documentElement: { dataset } },
    location: { pathname },
    sessionStorage,
    localStorage,
    Math: { floor: Math.floor, random: () => random },
  })
  return dataset
}

test("page palettes follow nested routes", () => {
  for (const page of PAGE_PALETTES) {
    const route = page === "home" ? "/" : "/" + page + "/nested"
    assert.equal(pagePaletteForPath(route), page)
    assert.equal(boot(route, 0).pagePalette, page)
  }
  assert.equal(pagePaletteForPath("/unknown"), "home")
})

test("each core palette is reachable and remains stable on refresh", () => {
  CORE_PALETTES.forEach((core, index) => {
    const session = storage()
    const first = boot("/", (index + 0.5) / CORE_PALETTES.length, session)
    assert.equal(first.corePalette, core)
    assert.equal(boot("/papers", 0.99, session).corePalette, core)
    assert.equal(boot("/blog/notes", 0, session).corePalette, core)
  })
})

test("fixed preference wins; malformed session values fall back to blue", () => {
  const session = storage(new Map([[PALETTE_SESSION_KEY, "rose"]]))
  const local = storage(new Map([[PALETTE_LOCK_KEY, "forest"]]))
  assert.equal(boot("/anime", 0.99, session, local).corePalette, "forest")
  assert.equal(boot("/", 0.99, storage(new Map([[PALETTE_SESSION_KEY, "unknown"]]))).corePalette, "blue")
})

test("storage failures leave the blue core and correct page", () => {
  const blocked = { getItem: () => { throw Error("blocked") }, setItem: () => {} }
  const result = boot("/friends", 0.9, blocked)
  assert.equal(result.corePalette, "blue")
  assert.equal(result.pagePalette, "friends")
})
