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
