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
    elapsed: 0,
    DURATION: 7400,
    render: (p: number) => progress.push(p),
    requestAnimationFrame: () => {},
    window: {
      parent: { postMessage: (data: unknown) => messages.push(data) },
      location: { origin: "https://nothing-new.cn" },
    },
  }
  runInNewContext(`${tick};tick(0);tick(1000);tick(6000);tick(7400)`, context)
  assert.deepEqual(progress, [0, 1000 / 7400, 6000 / 7400, 1])
  assert.deepEqual(JSON.parse(JSON.stringify(messages)), [{ type: "alpha-splash:complete" }])
  assert.equal(context.elapsed, 7400)
})

test("startup accepts only its same-origin iframe and keeps skip and timeout fail-open", async () => {
  const compiled = ts.transpileModule(splash, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText
  for (const mode of ["message", "timeout", "skip"] as const) {
    const classes = new Set<string>()
    const dataset: Record<string, string> = {}
    const listeners = new Map<string, (event?: unknown) => void>()
    const timers = new Map<number, { callback: () => void; delay: number }>()
    const phases: string[] = []
    const effects: (() => () => void)[] = []
    const frameWindow = {}
    let timerId = 0
    const setTimer = (callback: () => void, delay: number) => {
      timers.set(++timerId, { callback, delay })
      return timerId
    }
    const exports: { default?: (props: { blogHref: string }) => unknown } = {}
    const element = (type: unknown, props: Record<string, unknown>) => ({ type, props })
    runInNewContext(compiled, {
      exports,
      AbortController,
      Promise,
      queueMicrotask: (fn: () => void) => fn(),
      setTimeout: setTimer,
      clearTimeout: (id: number) => timers.delete(id),
      navigator: {},
      matchMedia: (query: string) => ({ matches: query.includes("min-width") }),
      performance: { now: () => 0, mark: (name: string) => phases.push(name) },
      window: {
        location: { pathname: "/", origin: "https://nothing-new.cn" },
        setTimeout: setTimer,
        clearTimeout: (id: number) => timers.delete(id),
        addEventListener: (name: string, fn: (event?: unknown) => void) => listeners.set(name, fn),
        removeEventListener: (name: string) => listeners.delete(name),
        dispatchEvent() {},
      },
      document: {
        documentElement: {
          dataset,
          classList: {
            contains: (name: string) => classes.has(name),
            add: (name: string) => classes.add(name),
          },
        },
        images: [],
        fonts: { ready: Promise.resolve() },
        querySelector: (selector: string) =>
          selector.includes("home-artwork") ? { dataset: { homeArtwork: "ready" } } : null,
      },
      Event,
      require: (name: string) => {
        if (name === "react/jsx-runtime")
          return { jsx: element, jsxs: element, Fragment: "fragment" }
        if (name === "react")
          return {
            useCallback: (fn: unknown) => fn,
            useState: (value: unknown) => [value, () => {}],
            useRef: (value: unknown) => ({
              current: value === null ? { contentWindow: frameWindow } : value,
            }),
            useEffect: (fn: () => () => void) => effects.push(fn),
          }
        if (name === "next/navigation") return { useRouter: () => ({ prefetch() {} }) }
        if (name === "next/image") return { getImageProps: () => ({ props: {} }) }
        if (name.endsWith("Navbar")) return { navigationLinks: [] }
        if (name.endsWith("home-scene")) return { isMobileHomeClient: () => false }
        if (name.endsWith("anime/client")) return { loadAnimeSnapshot: async () => {} }
        if (name.endsWith("room-preload")) return { preloadRoomAssets: async () => {} }
        throw new Error(`Unexpected startup dependency: ${name}`)
      },
    })
    const tree = exports.default!({ blogHref: "/blog/preferred" })
    const cleanup = effects[0]()
    const message = listeners.get("message")!
    const valid = {
      origin: "https://nothing-new.cn",
      source: frameWindow,
      data: { type: "alpha-splash:complete" },
    }
    message({ ...valid, origin: "https://other.invalid" })
    message({ ...valid, source: {} })
    assert.equal(classes.has("splash-seen"), false)
    listeners.get("alpha-splash:frame-loaded")!()
    const fallback = [...timers.values()].find((timer) => timer.delay === 9500)
    assert.ok(fallback)
    if (mode === "message") message(valid)
    if (mode === "timeout") fallback.callback()
    if (mode === "skip") {
      const findButton = (node: unknown): { onClick: () => void } | undefined => {
        if (!node || typeof node !== "object") return
        const item = node as { type?: string; props?: { children?: unknown; onClick: () => void } }
        if (item.type === "button") return item.props
        const children = item.props?.children
        for (const child of Array.isArray(children) ? children : [children]) {
          const found = findButton(child)
          if (found) return found
        }
      }
      findButton(tree)!.onClick()
    }
    message(valid)
    assert.equal(dataset.startupPhase, "ready", mode)
    assert.equal(classes.has("splash-seen"), true)
    assert.equal(phases.filter((phase) => phase === "site:ready").length, 1)
    cleanup()
    assert.equal(listeners.size, 0)
    await Promise.resolve()
  }
})

const animation = readFileSync(new URL("../public/alpha-opening-v6.html", import.meta.url), "utf8")
type Point = [number, number]
const vertices: Point[] = [...animation.matchAll(/<circle cx="([^"]+)" cy="([^"]+)"/g)].map(
  (match) => [Number(match[1]), Number(match[2])],
)
const simplices = (kind: string) =>
  [
    ...animation.matchAll(
      new RegExp(`<path class="${kind}" data-alpha="([^"]+)" d="([^"]+)"`, "g"),
    ),
  ].map((match) => ({
    birth: Number(match[1]),
    points: [...match[2].matchAll(/[ML]([\d.]+) ([\d.]+)/g)].map(
      (xy): Point => [Number(xy[1]), Number(xy[2])],
    ),
  }))
const alphaFaces = simplices("mesh-face")
const alphaEdges = simplices("mesh-edge")
const distanceSquared = (a: Point, b: Point) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2
const pointKey = (point: Point) => point.join(",")
const edgeKey = (a: Point, b: Point) => [pointKey(a), pointKey(b)].sort().join(";")

test("Alpha births match empty circumcircles and Gabriel or inherited edge radii", () => {
  assert.equal(vertices.length, 1150)
  assert.ok(alphaFaces.length > 2100)
  const vertexKeys = new Set(vertices.map(pointKey))
  const edgeBirths = new Map(
    alphaEdges.map((edge) => [edgeKey(...(edge.points as [Point, Point])), edge.birth]),
  )
  const cofaceBirths = new Map<string, number>()
  for (const {
    birth,
    points: [a, b, c],
  } of alphaFaces) {
    for (const point of [a, b, c]) assert.ok(vertexKeys.has(pointKey(point)))
    const ux = b[0] - a[0],
      uy = b[1] - a[1]
    const vx = c[0] - a[0],
      vy = c[1] - a[1]
    const determinant = 2 * (ux * vy - uy * vx)
    const u2 = ux * ux + uy * uy,
      v2 = vx * vx + vy * vy
    const center: Point = [
      a[0] + (u2 * vy - v2 * uy) / determinant,
      a[1] + (ux * v2 - vx * u2) / determinant,
    ]
    const radiusSquared = distanceSquared(a, center)
    assert.ok(Math.abs(Math.sqrt(radiusSquared) - birth) < 1e-6)
    for (const point of vertices) assert.ok(distanceSquared(point, center) >= radiusSquared - 1e-7)
    for (const [p, q] of [
      [a, b],
      [b, c],
      [c, a],
    ]) {
      const key = edgeKey(p, q)
      assert.ok(edgeBirths.has(key), "Every triangle includes its boundary edges")
      assert.ok(edgeBirths.get(key)! <= birth + 1e-6, "Edges cannot enter after a coface")
      cofaceBirths.set(key, Math.min(birth, cofaceBirths.get(key) ?? Infinity))
    }
  }
  for (const {
    birth,
    points: [a, b],
  } of alphaEdges) {
    assert.ok(vertexKeys.has(pointKey(a)) && vertexKeys.has(pointKey(b)))
    const midpoint: Point = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
    const halfSquared = distanceSquared(a, b) / 4
    const gabriel = vertices.every(
      (point) => distanceSquared(point, midpoint) >= halfSquared - 1e-8,
    )
    const expected = gabriel ? Math.sqrt(halfSquared) : cofaceBirths.get(edgeKey(a, b))
    assert.ok(expected !== undefined && Math.abs(birth - expected) < 1e-6)
  }
})

test("Alpha grows through the second half, then the whole complex fades without reversing", () => {
  const node = (birth = 0) => ({ dataset: { alpha: String(birth) }, style: { opacity: "0" } })
  const faces = alphaFaces.map((face) => node(face.birth))
  const edges = alphaEdges.map((edge) => node(edge.birth))
  const points = vertices.map(() => node())
  const geometry = node()
  const window = {
    __alphaSplash: undefined as unknown as {
      seek(p: number): void
      state: {
        alpha: number
        activeTriangles: number
        visibleTriangles: number
        visiblePoints: number
      }
    },
  }
  runInNewContext(animation.match(/<script>([\s\S]*?)<\/script>/)![1], {
    document: {
      querySelectorAll: (selector: string) =>
        selector.includes("faces") ? faces : selector.includes("edges") ? edges : points,
      getElementById: () => geometry,
    },
    window,
    matchMedia: () => ({ matches: false }),
    requestAnimationFrame() {},
  })
  let previousAlpha = 0
  let previousCount = 0
  for (let step = 0; step <= 100; step++) {
    window.__alphaSplash.seek(step / 100)
    const state = window.__alphaSplash.state
    assert.ok(state.alpha >= previousAlpha, `Alpha went backwards at ${step}%`)
    assert.ok(state.activeTriangles >= previousCount)
    previousAlpha = state.alpha
    previousCount = state.activeTriangles
    if (step <= 91) assert.equal(geometry.style.opacity, "1")
  }
  assert.equal(previousAlpha, 40)
  assert.equal(previousCount, alphaFaces.length)
  assert.equal(geometry.style.opacity, "0")
  assert.equal(window.__alphaSplash.state.visibleTriangles, 0)
  assert.equal(window.__alphaSplash.state.visiblePoints, 0)
  assert.doesNotMatch(animation, /brand-group|brand-paths|organic-thread|EulerBridgeMark/)
})

test("completed Alpha mesh covers the guarded viewBox including all four borders", () => {
  assert.match(animation, /viewBox="64 64 1472 772" preserveAspectRatio="xMidYMid slice"/)
  const cross = (a: Point, b: Point, p: Point) =>
    (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])
  for (let x = 0; x <= 32; x++) {
    for (let y = 0; y <= 24; y++) {
      const p: Point = [64 + (1472 * x) / 32, 64 + (772 * y) / 24]
      assert.ok(
        alphaFaces.some(({ points: [a, b, c] }) => {
          const signs = [cross(a, b, p), cross(b, c, p), cross(c, a, p)]
          return signs.every((v) => v >= -1e-8) || signs.every((v) => v <= 1e-8)
        }),
        `Uncovered viewport sample at ${p}`,
      )
    }
  }
})
