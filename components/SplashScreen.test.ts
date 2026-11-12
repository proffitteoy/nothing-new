import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { runInNewContext } from "node:vm"
import { test } from "node:test"
import ts from "typescript"

const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8")
const splash = readFileSync(new URL("./SplashScreen.tsx", import.meta.url), "utf8")

test("layout resolves one blog entry for both startup prefetch and navigation", () => {
  assert.match(layout, /const blogHref = await getBlogEntryRoute\(\)/)
  assert.match(layout, /<SplashScreen blogHref=\{blogHref\}/)
  assert.match(layout, /<Navbar blogHref=\{blogHref\}/)
  assert.doesNotMatch(layout, /hasSeenSplash/)
  assert.doesNotMatch(splash, /fieldReady|performanceMode|"particles"/)
  assert.match(splash, /if \(!roomLoading && !homeLoading\) break/)
})

test("entry bootstrap distinguishes home and subpages and fails open without hydration", () => {
  const tree = ts.createSourceFile(
    "layout.tsx",
    layout,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  let bootstrap = ""
  const visit = (node: ts.Node) => {
    if (ts.isNoSubstitutionTemplateLiteral(node) && node.text.includes("dataset.startupEntry ="))
      bootstrap = node.text
    ts.forEachChild(node, visit)
  }
  visit(tree)
  assert.ok(bootstrap)
  for (const pathname of ["/", "/about", "/blog/math/test"]) {
    const classes = new Set<string>()
    const dataset: Record<string, string> = {}
    const timers: (() => void)[] = []
    const events: string[] = []
    runInNewContext(bootstrap, {
      document: {
        documentElement: {
          dataset,
          classList: {
            contains: (key: string) => classes.has(key),
            add: (key: string) => classes.add(key),
          },
        },
      },
      location: { pathname },
      window: {
        setTimeout: (callback: () => void, delay: number) => {
          assert.equal(delay, 22000)
          timers.push(callback)
        },
        dispatchEvent: (event: Event) => events.push(event.type),
      },
      Event,
    })
    assert.equal(dataset.startupEntry, pathname === "/" ? "home" : "page")
    assert.equal(dataset.startupPhase, pathname === "/" ? "loading" : "preparing")
    assert.equal(timers.length, 1)
    timers[0]()
    assert.ok(classes.has("splash-seen"))
    assert.equal(dataset.startupPhase, "ready")
    assert.deepEqual(events, ["site-startup-phase"])
    timers[0]()
    assert.equal(events.length, 1)
  }
  assert.match(layout, /<noscript>/)
  assert.match(layout, /html\[data-startup-entry="page"\] \[data-startup-loading\]/)
})

test("Alpha opening completes once its geometry vanishes and reveals the home canvas", () => {
  assert.match(splash, /src="\/alpha-opening-v6\.html"/)
  assert.match(splash, /event\.source !== iframeRef\.current\?\.contentWindow/)
  assert.match(splash, /event\.origin !== window\.location\.origin/)
  assert.match(splash, /const finishAnimation = \(\) =>/)
  assert.match(splash, /animationFinished = true/)
  assert.match(splash, /window\.setTimeout\(finishAnimation, 9500\)/)
  assert.doesNotMatch(splash, /logoHoldTimer|logoFinished|preloadFinished/)
  assert.match(splash, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/)
  assert.match(splash, /\(min-width: 768px\)/)
  assert.doesNotMatch(splash, /头像光环|siteConfig\.avatarUrl/)
})

test("Alpha opening keeps its 7.4s duration even when frames are slow", () => {
  const animation = readFileSync(
    new URL("../public/alpha-opening-v6.html", import.meta.url),
    "utf8",
  )
  const tick = animation.match(/function tick\(now\)\{[^\n]+/u)?.[0]
  assert.ok(tick)
  const progress: number[] = []
  const messages: unknown[] = []
  const context = {
    previous: null,
    playing: true,
    elapsed: 0,
    DURATION: 7400,
    render: (p: number) => progress.push(p),
    requestAnimationFrame: () => {},
    window: {
      parent: { postMessage: (data: unknown) => messages.push(data) },
      location: { origin: "https://nothing-new.cn" },
    },
  }
  runInNewContext(`${tick};tick(0);tick(1000);tick(6000);tick(7400);tick(9000)`, context)
  assert.deepEqual(progress, [0, 1000 / 7400, 6000 / 7400, 1])
  assert.deepEqual(JSON.parse(JSON.stringify(messages)), [{ type: "alpha-splash:complete" }])
  assert.equal(context.elapsed, 7400)
  assert.equal(context.playing, false)
})

test("opening renders real Alpha faces, preserves H1 events, and clears completely", () => {
  const animation = readFileSync(
    new URL("../public/alpha-opening-v6.html", import.meta.url),
    "utf8",
  )
  assert.match(animation, /class="mesh-face" data-alpha=/)
  assert.match(animation, /class="transient" data-b="[0-9.]+" data-d=/)
  assert.match(animation, /const triangles=source\.getAttribute\('d'\)\.match/)
  assert.match(animation, /setOpacity\(face,\.92\*smooth/)
  assert.match(animation, /setOpacity\(point,0\)/)
  assert.match(animation, /if\(elapsed===DURATION\)/)
  assert.doesNotMatch(animation, /brand-group|brand-paths|organic-thread|EulerBridgeMark/)
})
