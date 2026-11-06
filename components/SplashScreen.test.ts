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

test("Alpha opening uses the prepared V6 asset and bounded logo hold", () => {
  assert.match(splash, /src="\/alpha-opening-v6\.html"/)
  assert.match(splash, /event\.source !== iframeRef\.current\?\.contentWindow/)
  assert.match(splash, /event\.origin !== window\.location\.origin/)
  assert.match(splash, /logoHoldTimer = window\.setTimeout\(\(\) =>/)
  assert.match(splash, /}, 10_000\)/)
  assert.match(splash, /if \(logoFinished && preloadFinished/)
  assert.match(splash, /window\.setTimeout\(finishLogo, 9500\)/)
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
    $: () => ({ textContent: "" }),
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

test("Alpha ending reveals the complete mark without changing its paths", () => {
  const animation = readFileSync(
    new URL("../public/alpha-opening-v6.html", import.meta.url),
    "utf8",
  )
  const render = animation.slice(
    animation.indexOf("function render(p){"),
    animation.indexOf("function tick(now)"),
  )
  const elements = new Map<
    string,
    { style: Record<string, string>; value?: number; textContent?: string }
  >()
  const context = {
    data: { rStop: 34.8, intervals: [] },
    DURATION: 7400,
    clamp: (value: number) => Math.max(0, Math.min(1, value)),
    at: (p: number, start: number, end: number) => {
      const t = Math.max(0, Math.min(1, (p - start) / (end - start)))
      return t * t * (3 - 2 * t)
    },
    fmt: (value: number) => value.toFixed(2),
    edges: [],
    faces: [],
    trcycles: [],
    discs: [],
    $: (id: string) => {
      if (!elements.has(id)) elements.set(id, { style: {} })
      return elements.get(id)!
    },
  }
  runInNewContext(`${render};render(0.6)`, context)
  assert.equal(elements.get("brand-group")?.style.opacity, "0.00")
  runInNewContext(`${render};render(0.86)`, context)
  assert.equal(elements.get("brand-group")?.style.opacity, "0.50")
  assert.equal(elements.get("brand-nodes")?.style.opacity, "1")
  runInNewContext(`${render};render(1)`, context)
  assert.equal(elements.get("brand-group")?.style.opacity, "1.00")
  assert.ok(
    [...elements.values()].every((element) =>
      Object.keys(element.style).every((key) => key === "opacity"),
    ),
  )
})
