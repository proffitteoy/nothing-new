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
  assert.doesNotMatch(layout, /FieldScene|FieldModeProvider|hasSeenSplash/)
  assert.doesNotMatch(splash, /fieldReady|performanceMode|"particles"/)
  assert.match(splash, /if \(!roomLoading\) break/)
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
  for (const pathname of ["/", "/about", "/music", "/blog/math/test"]) {
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
          assert.equal(delay, 9000)
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
