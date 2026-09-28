import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { runInNewContext } from "node:vm"
import ts from "typescript"
import type { useFieldMode } from "./FieldModeProvider"
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

test("music cover particles remain independent of the original home mode switch", () => {
  const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8")
  const home = readFileSync(new URL("./HomeStoryBoard.tsx", import.meta.url), "utf8")
  const music = readFileSync(new URL("../app/music/MusicClient.tsx", import.meta.url), "utf8")
  const toggle = readFileSync(new URL("./PerformanceToggleBlock.tsx", import.meta.url), "utf8")
  assert.match(layout, /<FieldScene\s*\/>/)
  assert.doesNotMatch(layout, /MineradioParticleField/)
  assert.match(layout, /<FieldModeProvider>/)
  assert.match(home, /<PerformanceToggleBlock\s*\/>/)
  assert.match(toggle, /<button\s+type="button"/)
  assert.match(toggle, /onClick=\{togglePerformanceMode\}/)
  assert.match(toggle, /aria-pressed=\{isFieldMode\}/)
  assert.doesNotMatch(toggle, /next\/link|href=|router\.|进入设置/)
  assert.match(toggle, /谱场 · 共享频率/)
  assert.match(toggle, /常规 · 轻量动画/)
  assert.doesNotMatch(music, /useFieldMode|performanceMode|particleToggle|aria-label="音乐页粒子"/)
  const tree = ts.createSourceFile(
    "MusicClient.tsx",
    music,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  let particles = 0
  const visit = (node: ts.Node) => {
    if (
      ts.isJsxSelfClosingElement(node) &&
      node.tagName.getText(tree) === "MineradioParticleField"
    ) {
      particles++
      assert.ok(ts.isJsxElement(node.parent), "cover particles must not be conditionally gated")
    }
    ts.forEachChild(node, visit)
  }
  visit(tree)
  assert.equal(particles, 1)
})

test("the field renderer mounts only on music and unmounts on every other route", () => {
  const source = readFileSync(new URL("./FieldScene.tsx", import.meta.url), "utf8")
  const tree = ts.createSourceFile(
    "FieldScene.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const gate = tree.statements.find(
    (node) => ts.isFunctionDeclaration(node) && node.name?.text === "FieldScene",
  )
  assert.ok(gate)
  const script = ts.transpileModule(gate.getText(tree), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const exports = {} as { default: () => unknown }
  const renderer = Symbol("MusicFieldScene")
  let pathname: string | null = "/music"
  runInNewContext(script, {
    exports,
    usePathname: () => pathname,
    MusicFieldScene: renderer,
    require: (name: string) => {
      assert.equal(name, "react/jsx-runtime")
      return { jsx: (type: unknown) => type }
    },
  })
  for (const route of [
    "/",
    "/about",
    "/friends",
    "/projects",
    "/anime",
    "/chatter/test",
    "/blog/math/test",
    "/music-other",
    null,
  ]) {
    pathname = "/music"
    assert.equal(exports.default(), renderer)
    pathname = route
    assert.equal(exports.default(), null)
  }
})

// Execute the provider's real storage/event logic with hook boundaries stubbed;
// no browser or WebGL renderer is needed for these state regressions.
const providerScript = ts.transpileModule(
  readFileSync(new URL("./FieldModeProvider.tsx", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } },
).outputText

function loadFieldMode(storage?: Pick<Storage, "getItem" | "setItem">, server = false) {
  type ModeState = ReturnType<typeof useFieldMode>
  const exports = {} as {
    FieldModeProvider: (props: { children: null }) => { value: ModeState }
    useFieldMode: () => ModeState
  }
  const window = new EventTarget()
  let subscribe: ((callback: () => void) => () => void) | undefined
  runInNewContext(providerScript, {
    exports,
    window,
    Event,
    localStorage: storage,
    require: (name: string) => {
      if (name === "react/jsx-runtime") {
        return { jsx: (_type: unknown, props: unknown) => props }
      }
      assert.equal(name, "react")
      return {
        createContext: (value: ModeState) => ({ value }),
        useContext: (context: { value: ModeState }) => context.value,
        useMemo: (factory: () => ModeState) => factory(),
        useSyncExternalStore: (
          onSubscribe: typeof subscribe,
          readSnapshot: () => string,
          readServerSnapshot: () => string,
        ) => {
          subscribe = onSubscribe
          return server ? readServerSnapshot() : readSnapshot()
        },
      }
    },
  })
  return {
    render: () => exports.FieldModeProvider({ children: null }).value,
    defaultMode: exports.useFieldMode().performanceMode,
    subscribe: (callback: () => void) => {
      assert.ok(subscribe)
      return subscribe(callback)
    },
    window,
  }
}

test("particle mode defaults off for missing, invalid or unavailable storage and SSR", () => {
  for (const saved of [null, "", "invalid", "normal"]) {
    const provider = loadFieldMode({ getItem: () => saved, setItem: () => assert.fail() })
    assert.equal(provider.render().performanceMode, "normal")
    assert.equal(provider.defaultMode, "normal")
  }
  assert.equal(loadFieldMode().render().performanceMode, "normal")
  assert.equal(
    loadFieldMode({ getItem: () => "field", setItem: () => assert.fail() }, true).render()
      .performanceMode,
    "normal",
    "SSR stays off even when the browser has a saved opt-in",
  )
})

test("the home toggle persists opt-in and opt-out and notifies shared state subscribers", () => {
  let saved: string | null = null
  const storage = {
    getItem: (key: string) => {
      assert.equal(key, "blog-performance-mode")
      return saved
    },
    setItem: (key: string, value: string) => {
      assert.equal(key, "blog-performance-mode")
      saved = value
    },
  }
  const provider = loadFieldMode(storage)
  assert.equal(provider.render().performanceMode, "normal")
  let notifications = 0
  const unsubscribe = provider.subscribe(() => notifications++)
  for (const expected of ["field", "normal"] as const) {
    provider.render().togglePerformanceMode()
    assert.equal(saved, expected)
    assert.equal(provider.render().performanceMode, expected)
    assert.equal(loadFieldMode(storage).render().performanceMode, expected)
  }
  assert.equal(notifications, 2)
  saved = "field"
  provider.window.dispatchEvent(new Event("storage"))
  assert.equal(provider.render().performanceMode, "field")
  assert.equal(notifications, 3)
  unsubscribe()
  provider.window.dispatchEvent(new Event("storage"))
  provider.render().togglePerformanceMode()
  assert.equal(notifications, 3)
})

test("blocked storage starts off and still allows explicit toggling for the session", () => {
  for (const failRead of [false, true]) {
    const provider = loadFieldMode({
      getItem: () => {
        if (failRead) throw new Error("storage read blocked")
        return null
      },
      setItem: () => {
        throw new Error("storage write blocked")
      },
    })
    assert.equal(provider.render().performanceMode, "normal")
    provider.render().togglePerformanceMode()
    assert.equal(provider.render().performanceMode, "field")
    provider.render().togglePerformanceMode()
    assert.equal(provider.render().performanceMode, "normal")
  }
})
