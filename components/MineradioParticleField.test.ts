import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import {
  coverParticleGridForResolution,
  coverResolutionForViewport,
} from "./MineradioParticleField"

test("music particle density increases within bounded viewport budgets", () => {
  for (const [width, expectedGrid] of [
    [390, 107],
    [639, 107],
    [640, 143],
    [1280, 143],
    [1440, 165],
    [2560, 165],
  ]) {
    const grid = coverParticleGridForResolution(coverResolutionForViewport(width, false))
    assert.equal(grid, expectedGrid)
    assert.ok(grid * grid <= 27225)
    assert.equal(grid % 2, 1)
  }
})

test("reduced motion retains its existing 8649-particle budget at every width", () => {
  for (const width of [390, 640, 1280, 2560]) {
    assert.equal(coverParticleGridForResolution(coverResolutionForViewport(width, true)) ** 2, 8649)
  }
})

test("global particles and their toggle are unmounted while the music field remains", () => {
  const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8")
  const home = readFileSync(new URL("./HomeStoryBoard.tsx", import.meta.url), "utf8")
  const music = readFileSync(new URL("../app/music/MusicClient.tsx", import.meta.url), "utf8")
  assert.doesNotMatch(layout, /FieldScene|FieldModeProvider|MineradioParticleField/)
  assert.doesNotMatch(home, /PerformanceToggleBlock/)
  assert.match(music, /<MineradioParticleField\s/)
})
