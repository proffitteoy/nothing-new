import assert from "node:assert/strict"
import { test } from "node:test"
import { createHomeVisitClock, homeCycleAt, homeImageRect, HOME_PERSON } from "./home-scene"
import { proxy } from "../proxy"
import { NextRequest } from "next/server"

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
    if (width / height <= 1.4) {
      assert.deepEqual(room, { x: 0, y: 0, width, height })
      assert.ok(opening.x >= 56 && opening.x + opening.width <= width - 56)
    } else {
      assert.ok(Math.abs(room.width / room.height - HOME_ROOM.width / HOME_ROOM.height) < 1e-10)
    }
    assert.ok(Math.abs((opening.x - room.x) / room.width - 211 / 1586) < 1e-10)
    assert.ok(Math.abs((opening.y - room.y) / room.height - 166 / 992) < 1e-10)
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
