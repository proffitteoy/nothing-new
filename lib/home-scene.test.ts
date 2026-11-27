import assert from "node:assert/strict"
import { test } from "node:test"
import {
  createHomeVisitClock,
  homeCycleAt,
  homeImageRect,
  homeOpeningRevealPath,
  HOME_PERSON,
  homeProjectProgress,
  homeProjectScroll,
} from "./home-scene"
import { proxy } from "../proxy"
import { NextRequest } from "next/server"

test("window, room and landscape checkpoints round-trip through the native track after resize", () => {
  for (const height of [480, 600, 768, 800, 900, 928, 1080]) {
    assert.equal(homeProjectProgress(0, height), -1)
    assert.equal(homeProjectProgress(2 * height, height), 0)
    assert.equal(homeProjectProgress(4 * height, height), 1)
    for (const progress of [-1, -0.9, -0.35, 0, 0.35, 0.9, 1])
      assert.ok(
        Math.abs(homeProjectProgress(homeProjectScroll(progress, height), height) - progress) <
          1e-12,
      )
  }
  assert.equal(homeProjectProgress(-100, 900), -1)
  assert.equal(homeProjectProgress(100000, 900), 1)
})

test("visible visit time pauses for hidden 60s, resumes and can start a new visit", () => {
  const clock = createHomeVisitClock(1000)
  assert.equal(clock.read(31000), 30000)
  clock.visibility(31000, false)
  assert.equal(clock.read(91000), 30000)
  clock.visibility(91000, true)
  assert.equal(clock.read(101000), 40000)
  assert.equal(createHomeVisitClock(101000).read(101000), 0)
  const hiddenStart = createHomeVisitClock(1000, false)
  assert.equal(hiddenStart.read(20000), 0)
})

test("cycle phases and ink return continuously through two cycles", () => {
  const samples = [0, 30, 90, 150, 210, 240, 255, 275, 290, 300, 310, 600, 610]
  assert.deepEqual(
    samples.map((s) => homeCycleAt(s).phase),
    [
      "initial",
      "deposit",
      "deposit",
      "deposit",
      "unstable",
      "fracture",
      "fracture",
      "reform",
      "reset",
      "initial",
      "initial",
      "initial",
      "initial",
    ],
  )
  let previous = -1
  for (let s = 0; s <= 210; s++) {
    const value = homeCycleAt(s)
    assert.ok(value.depth >= previous)
    previous = value.depth
  }
  assert.equal(homeCycleAt(0).coverage, 0)
  assert.equal(homeCycleAt(299.999).coverage, 0)
  assert.equal(homeCycleAt(299.999).disruption, 0)
  assert.deepEqual(homeCycleAt(10), homeCycleAt(310))
  assert.deepEqual(homeCycleAt(10), homeCycleAt(610))
  assert.equal(homeCycleAt(120, 240).seconds, 150)
  assert.equal(homeCycleAt(180, 360).seconds, 150)
})

test("cover fills three desktops while facial details stay inside the viewport", () => {
  for (const [width, height] of [
    [1440, 900],
    [1280, 800],
    [1024, 768],
  ]) {
    const rect = homeImageRect(width, height)
    assert.ok(rect.width >= width && rect.height >= height)
    assert.ok(HOME_PERSON.length > 10)
    for (const [x, y] of [
      [680, 210],
      [1100, 650],
    ]) {
      assert.ok(rect.x + x * rect.scale >= 0 && rect.x + x * rect.scale <= width)
      assert.ok(rect.y + y * rect.scale >= 76 && rect.y + y * rect.scale <= height - 44)
    }
  }
})

test("root device redirect is temporary, uncacheable and never affects inner routes", () => {
  for (const ua of [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148",
    "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)",
    "Mozilla/5.0 (Linux; Android 14; Pixel Tablet)",
  ]) {
    const response = proxy(
      new NextRequest("https://nothing-new.cn/", { headers: { "user-agent": ua } }),
    )
    assert.equal(response.status, 307)
    assert.equal(response.headers.get("location"), "https://nothing-new.cn/blog")
    assert.match(response.headers.get("cache-control")!, /no-store/)
  }
  for (const ua of [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  ]) {
    assert.equal(
      proxy(new NextRequest("https://nothing-new.cn/", { headers: { "user-agent": ua } })).status,
      200,
    )
  }
})

test("room aperture and exterior share one measured projection with sufficient camera overscan", async () => {
  const { homeWindowProjection, homeWindowLook, HOME_ROOM } = await import("./home-scene")
  for (const [width, height] of [
    [1440, 900],
    [1920, 1080],
    [1280, 800],
    [1024, 768],
    [640, 720],
  ]) {
    const { room, opening, lake } = homeWindowProjection(width, height)
    assert.ok(Math.abs(room.width / room.height - HOME_ROOM.width / HOME_ROOM.height) < 1e-10)
    if (width >= 1024) assert.ok(opening.x >= 44 && opening.x + opening.width <= width - 44)
    assert.ok(
      Math.abs((opening.x - room.x) / room.width - HOME_ROOM.opening[0] / HOME_ROOM.width) < 1e-10,
    )
    assert.ok(
      Math.abs((opening.y - room.y) / room.height - HOME_ROOM.opening[1] / HOME_ROOM.height) <
        1e-10,
    )
    for (const x of [-1, 1])
      for (const y of [-1, 1]) {
        const look = homeWindowLook(x, y, opening.height)
        assert.ok(lake.x - look.x < opening.x)
        assert.ok(lake.x + lake.width - look.x > opening.x + opening.width)
        assert.ok(lake.y - look.y < opening.y)
        assert.ok(lake.y + lake.height - look.y > opening.y + opening.height)
      }
  }
})

test("the opening grows below the ridge into the lake before the sky, without closing again", () => {
  const ridge = [
    [0, 282],
    [420, 240],
    [836, 404],
    [1250, 280],
    [1672, 180],
  ]
  const polygon = (progress: number) =>
    homeOpeningRevealPath(progress, ridge)
      .slice(1, -2)
      .split(" L")
      .map((pair) => pair.split(" ").map(Number))
  const inside = (points: number[][], x: number, y: number) => {
    let hit = false
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const a = points[i],
        b = points[j]
      if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0])
        hit = !hit
    }
    return hit
  }
  assert.equal(inside(polygon(0), 836, 444), false)
  assert.equal(inside(polygon(0.12), 836, 444), true, "start just below the valley ridge")
  assert.equal(
    inside(polygon(0.3), 836, 364),
    false,
    "sky stays covered while the lower slope opens",
  )
  assert.equal(inside(polygon(0.3), 836, 520), true)
  assert.equal(inside(polygon(0.5), 836, 364), false, "sky opens after the lower half has spread")
  assert.equal(inside(polygon(0.5), 500, 300), true, "the wave follows the higher left ridge")
  assert.equal(inside(polygon(0.5), 500, 600), false, "outer lower boundary still forms a U")
  assert.equal(inside(polygon(0.5), 836, 650), true)
  const stages = [0.12, 0.25, 0.4, 0.55, 0.7, 0.85, 1].map(polygon)
  for (let x = 80; x <= 1600; x += 80)
    for (let y = 60; y <= 820; y += 40) {
      let revealed = false
      for (const points of stages) {
        const visible = inside(points, x, y)
        if (revealed) assert.equal(visible, true, "revealed scenery never closes again")
        revealed ||= visible
      }
      assert.equal(inside(stages.at(-1)!, x, y), true, "final opening covers the window")
    }
  assert.equal(homeOpeningRevealPath(-1, ridge), homeOpeningRevealPath(0, ridge))
  assert.equal(homeOpeningRevealPath(2, ridge), homeOpeningRevealPath(1, ridge))
})
