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

test("the home entry navigates to music and the music-page control owns the particle toggle", () => {
  const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8")
  const home = readFileSync(new URL("./HomeStoryBoard.tsx", import.meta.url), "utf8")
  const music = readFileSync(new URL("../app/music/MusicClient.tsx", import.meta.url), "utf8")
  const toggle = readFileSync(new URL("./PerformanceToggleBlock.tsx", import.meta.url), "utf8")
  assert.doesNotMatch(layout, /FieldScene|MineradioParticleField/)
  assert.match(layout, /<FieldModeProvider>/)
  assert.match(home, /<PerformanceToggleBlock\s*\/>/)
  assert.match(toggle, /<Link\s+href="\/music"/)
  assert.doesNotMatch(toggle, /onClick|togglePerformanceMode/)
  assert.match(toggle, /音乐页粒子/)
  assert.match(music, /const \{ performanceMode, togglePerformanceMode \} = useFieldMode\(\)/)
  assert.match(music, /onClick=\{togglePerformanceMode\}/)
  assert.match(music, /aria-label="音乐页粒子"/)
  assert.match(music, /aria-pressed=\{performanceMode === "field"\}/)
  assert.equal(
    (music.match(/\{particleToggle\}/g) ?? []).length,
    2,
    "the control remains available while music is loading or unavailable",
  )
  assert.match(music, /performanceMode === "field" && \(\s*<MineradioParticleField\s/)
})
