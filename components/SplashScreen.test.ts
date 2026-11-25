import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { runInNewContext } from "node:vm"
import { test } from "node:test"
import ts from "typescript"

const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8")
const splash = readFileSync(new URL("./SplashScreen.tsx", import.meta.url), "utf8")
const compiled = ts.transpileModule(splash, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  },
}).outputText

type Node = { type: string; props: Record<string, unknown> & { onClick?: () => void } }
const element = (type: string, props: Node["props"]) => ({ type, props })
function button(value: unknown): Node | undefined {
  const node = value as Node | undefined
  if (!node || typeof node !== "object") return
  if (node.type === "button") return node
  const children = node.props?.children
  for (const child of Array.isArray(children) ? children : [children]) {
    const found = button(child)
    if (found) return found
  }
}
const flush = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve()
}

async function startup(
  options: {
    path?: string
    mobile?: boolean
    reduced?: boolean
    saveData?: boolean
    artwork?: string
    seen?: boolean
  } = {},
) {
  let now = 0,
    id = 0,
    route = options.path ?? "/",
    refIndex = 0,
    stateIndex = 0
  const timers = new Map<number, { at: number; callback: () => void }>()
  const frames = new Map<number, (at: number) => void>()
  const listeners = new Map<string, () => void>()
  const classes = new Set(options.seen ? ["splash-seen"] : [])
  const dataset: Record<string, string> = { startupPhase: options.seen ? "ready" : "loading" }
  const home = { dataset: { homeArtwork: options.artwork ?? "ready" } }
  const marks: { name: string; at: number }[] = []
  const attributes = new Set<string>()
  const ui = {
    inert: false,
    setAttribute: (name: string) => attributes.add(name),
    removeAttribute: (name: string) => attributes.delete(name),
  }
  const surface = { dataset: {} as Record<string, string>, querySelector: () => ({}) }
  const refs: { current: unknown }[] = [],
    states: unknown[] = []
  let effects: (() => void | (() => void))[] = []
  const setTimer = (callback: () => void, delay: number) => {
    timers.set(++id, { at: now + delay, callback })
    return id
  }
  const exports: { default?: (props: { blogHref: string }) => Node } = {}
  runInNewContext(compiled, {
    exports,
    AbortController,
    Promise,
    Event,
    queueMicrotask: (callback: () => void) => callback(),
    setTimeout: setTimer,
    clearTimeout: (key: number) => timers.delete(key),
    requestAnimationFrame: (callback: (at: number) => void) => {
      frames.set(++id, callback)
      return id
    },
    cancelAnimationFrame: (key: number) => frames.delete(key),
    navigator: { connection: { saveData: options.saveData } },
    matchMedia: (query: string) => ({ matches: query.includes("min-width") || !!options.reduced }),
    performance: { now: () => now, mark: (name: string) => marks.push({ name, at: now }) },
    window: {
      location: { pathname: route },
      setTimeout: setTimer,
      clearTimeout: (key: number) => timers.delete(key),
      addEventListener: (name: string, callback: () => void) => listeners.set(name, callback),
      removeEventListener: (name: string) => listeners.delete(name),
      dispatchEvent: (event: Event) => listeners.get(event.type)?.(),
      Image: class {
        decode() {
          return new Promise(() => {})
        }
      },
    },
    document: {
      documentElement: {
        dataset,
        classList: {
          contains: (key: string) => classes.has(key),
          add: (key: string) => classes.add(key),
        },
      },
      querySelectorAll: (selector: string) =>
        selector === "#app-mount-root" || attributes.has("data-startup-inert") ? [ui] : [],
      querySelector: (selector: string) =>
        selector === "[data-home-artwork-kind]" ? home : { dataset: { homeArtwork: "loading" } },
      images: [],
      fonts: { ready: Promise.resolve() },
      createElement: () => ({ remove() {} }),
      head: { appendChild() {} },
    },
    require: (name: string) => {
      if (name === "react/jsx-runtime") return { jsx: element, jsxs: element, Fragment: "fragment" }
      if (name === "react")
        return {
          useCallback: (fn: unknown) => fn,
          useId: () => "opening",
          useState: (value: unknown) => {
            const index = stateIndex++
            if (!(index in states)) states[index] = value
            return [
              states[index],
              (next: unknown) => {
                states[index] = typeof next === "function" ? next(states[index]) : next
              },
            ]
          },
          useRef: (value: unknown) =>
            refs[refIndex++] ??
            (refs[refIndex - 1] = { current: value === null ? surface : value }),
          useEffect: (fn: () => () => void) => effects.push(fn),
        }
      if (name === "next/navigation")
        return { useRouter: () => ({ prefetch() {} }), usePathname: () => route }
      if (name === "next/image") return { getImageProps: () => ({ props: {} }) }
      if (name.endsWith("Navbar")) return { navigationLinks: [] }
      if (name.endsWith("home-scene")) return { isMobileHomeClient: () => !!options.mobile }
      if (name.endsWith("paper-reports-client"))
        return { loadPaperReports: () => new Promise(() => {}) }
      if (name.endsWith("anime/client")) return { loadAnimeSnapshot: () => new Promise(() => {}) }
      if (name.endsWith("room-preload")) return { preloadRoomAssets: () => new Promise(() => {}) }
      if (name.endsWith(".webp")) return { __esModule: true, default: { src: "/lake.webp" } }
      if (name.endsWith(".css")) return { __esModule: true, default: {} }
      throw new Error(`Unexpected dependency ${name}`)
    },
  })
  const render = () => {
    refIndex = stateIndex = 0
    effects = []
    return exports.default!({ blogHref: "/blog/preferred" })
  }
  const tree = render()
  const cleanups = effects.map((effect) => effect()).filter(Boolean) as (() => void)[]
  for (const [key, callback] of [...frames]) {
    frames.delete(key)
    callback(now)
  }
  await flush()
  return {
    dataset,
    classes,
    home,
    marks,
    ui,
    timers,
    frames,
    listeners,
    states,
    skip: () => button(tree)!.props.onClick!(),
    route: (next: string) => {
      route = next
      render()
      effects[0]()
    },
    cleanup: () => cleanups.forEach((fn) => fn()),
    async advance(target: number) {
      while (true) {
        const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0]
        if (!next || next[1].at > target) break
        now = next[1].at
        timers.delete(next[0])
        next[1].callback()
        await flush()
      }
      now = target
      await flush()
    },
  }
}

test("home keeps the complete 2.4s presentation even when ready immediately", async () => {
  const h = await startup()
  await h.advance(1649)
  assert.equal(h.dataset.startupPhase, "loading")
  await h.advance(1650)
  assert.equal(h.dataset.startupPhase, "exiting")
  assert.equal(h.ui.inert, true)
  assert.equal(h.classes.has("splash-seen"), false)
  await h.advance(2399)
  assert.equal(h.classes.has("splash-seen"), false)
  await h.advance(2400)
  assert.equal(h.dataset.startupPhase, "ready")
  assert.equal(h.ui.inert, false)
  assert.equal(h.marks.filter((mark) => mark.name === "site:ready").length, 1)
  h.cleanup()
})

test("home waits for usable artwork independently of stalled background preloads", async () => {
  const h = await startup({ artwork: "loading" })
  await h.advance(2000)
  assert.equal(h.dataset.startupPhase, "loading")
  h.home.dataset.homeArtwork = "ready"
  await h.advance(2050)
  assert.equal(h.dataset.startupPhase, "exiting")
  await h.advance(2800)
  assert.equal(h.dataset.startupPhase, "ready")
  h.cleanup()
})

test("missing and failed artwork both fail open by 4.75s", async () => {
  for (const artwork of ["loading", "error"]) {
    const h = await startup({ artwork })
    await h.advance(3999)
    assert.equal(h.dataset.startupPhase, "loading")
    await h.advance(4000)
    assert.equal(h.dataset.startupPhase, "exiting")
    await h.advance(4750)
    assert.equal(h.dataset.startupPhase, "ready")
    assert.equal(h.timers.size, 0)
    h.cleanup()
  }
})

test("skip works on the first frame and midway through the crossfade", async () => {
  for (const at of [0, 1800]) {
    const h = await startup({ artwork: at ? "ready" : "loading" })
    await h.advance(at)
    h.skip()
    h.skip()
    assert.equal(h.dataset.startupPhase, "ready")
    assert.equal(h.ui.inert, false)
    assert.equal(h.timers.size, 0)
    assert.equal(h.frames.size, 0)
    assert.equal(h.listeners.size, 0)
    assert.equal(h.marks.filter((mark) => mark.name === "site:ready").length, 1)
    h.cleanup()
  }
})

test("reduced motion and Save-Data use a static plate and 150ms fade", async () => {
  for (const option of [{ reduced: true }, { saveData: true }]) {
    const h = await startup(option)
    await h.advance(0)
    assert.equal(h.states[1], "static")
    assert.equal(h.dataset.startupPhase, "exiting")
    await h.advance(150)
    assert.equal(h.dataset.startupPhase, "ready")
    h.cleanup()
  }
})

test("route departure and unmount cancel pending work without replaying the opening", async () => {
  const h = await startup({ artwork: "loading" })
  h.route("/about")
  assert.equal(h.dataset.startupPhase, "ready")
  assert.equal(h.timers.size, 0)
  h.route("/")
  assert.equal(h.marks.filter((mark) => mark.name === "site:opening").length, 1)
  h.cleanup()
  const pending = await startup({ artwork: "loading" })
  pending.cleanup()
  await flush()
  assert.equal(pending.timers.size, 0)
  assert.equal(pending.frames.size, 0)
  assert.equal(pending.listeners.size, 0)
})

test("mobile, subpages and already revealed layouts never start the landscape presentation", async () => {
  for (const option of [
    { mobile: true },
    { path: "/about" },
    { path: "/papers" },
    { seen: true },
  ]) {
    const h = await startup(option)
    await h.advance(2500)
    assert.equal(h.dataset.startupPhase, "ready")
    assert.equal(
      h.marks.some((mark) => mark.name === "site:opening"),
      false,
    )
    assert.equal(h.states[1], null)
    h.cleanup()
  }
  assert.doesNotMatch(splash, /<iframe|postMessage|alpha-splash/)
})

test("the pre-hydration watchdog releases input even if the crossfade is interrupted", () => {
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
    const classes = new Set<string>(),
      events: string[] = [],
      timers: (() => void)[] = []
    const dataset: Record<string, string> = {}
    const ui = { inert: true, removeAttribute() {} }
    runInNewContext(bootstrap, {
      document: {
        documentElement: {
          dataset,
          classList: {
            contains: (key: string) => classes.has(key),
            add: (key: string) => classes.add(key),
          },
        },
        querySelectorAll: () => [ui],
      },
      location: { pathname },
      Event,
      window: {
        setTimeout: (fn: () => void, delay: number) => {
          assert.equal(delay, 22000)
          timers.push(fn)
        },
        dispatchEvent: (event: Event) => events.push(event.type),
      },
    })
    assert.equal(dataset.startupEntry, pathname === "/" ? "home" : "page")
    dataset.startupPhase = "exiting"
    timers[0]()
    timers[0]()
    assert.ok(classes.has("splash-seen"))
    assert.equal(ui.inert, false)
    assert.deepEqual(events, ["site-startup-phase"])
  }
  assert.match(layout, /<noscript>/)
  assert.match(layout, /not\(\[data-startup-phase="exiting"\]\)/)
})

test("poster readiness requires both decoded images, or an actually drawn 3D scene", async () => {
  const source = readFileSync(new URL("./HomeSpectralCanvas.tsx", import.meta.url), "utf8")
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText
  let stateIndex = 0,
    effects: (() => () => void)[] = [],
    sceneStatus = "loading"
  const states: unknown[] = []
  const deferred = () => {
    let resolve!: () => void, reject!: (error: Error) => void
    const promise = new Promise<void>((yes, no) => {
      resolve = yes
      reject = no
    })
    return { promise, resolve, reject }
  }
  let first = deferred(),
    second = deferred()
  const exports: { default?: () => Node } = {}
  runInNewContext(code, {
    exports,
    Promise,
    require: (name: string) => {
      if (name === "react/jsx-runtime") return { jsx: element, jsxs: element }
      if (name === "react")
        return {
          useRef: () => ({
            current: {
              querySelectorAll: () => [
                { decode: () => first.promise },
                { decode: () => second.promise },
              ],
            },
          }),
          useEffect: (fn: () => () => void) => effects.push(fn),
          useState: (value: unknown) => {
            const i = stateIndex++
            if (!(i in states)) states[i] = value
            return [
              states[i],
              (next: unknown) => {
                states[i] = typeof next === "function" ? next(states[i]) : next
              },
            ]
          },
        }
      if (name.endsWith("HomeProjectNavigation"))
        return { useHomeProjectState: () => ({ enabled: true, sceneStatus }) }
      if (name.endsWith(".webp")) return { __esModule: true, default: { src: "/image.webp" } }
      return { __esModule: true, default: {} }
    },
  })
  const render = () => {
    stateIndex = 0
    effects = []
    return exports.default!()
  }
  assert.equal(render().props["data-home-artwork"], "loading")
  let cleanup = effects[0]()
  first.resolve()
  await flush()
  assert.equal(render().props["data-home-artwork"], "loading")
  second.resolve()
  await flush()
  sceneStatus = "error"
  assert.equal(
    render().props["data-home-artwork"],
    "ready",
    "decoded poster survives WebGL failure",
  )
  cleanup()
  states[0] = "loading"
  first = deferred()
  second = deferred()
  render()
  cleanup = effects[0]()
  first.reject(new Error("image failed"))
  await flush()
  const failed = render()
  assert.equal(failed.props["data-home-artwork"], "error")
  button(failed)!.props.onClick!()
  assert.equal(states[0], "loading")
  assert.equal(states[1], 1)
  cleanup()
  first = deferred()
  second = deferred()
  render()
  cleanup = effects[0]()
  cleanup()
  first.resolve()
  second.resolve()
  await flush()
  assert.equal(states[0], "loading", "late decodes cannot update an unmounted poster")
  sceneStatus = "ready"
  assert.equal(render().props["data-home-artwork"], "ready")
  assert.equal(render().props.hidden, true)
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

test("papers reveal while unrelated resource preloads remain pending", async () => {
  const h = await startup({ path: "/papers" })
  await h.advance(0)
  assert.equal(h.dataset.startupPhase, "ready")
  h.cleanup()
})
