import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { parseArgs } from "node:util"
import { pathToFileURL } from "node:url"

const { values } = parseArgs({
  options: {
    url: { type: "string", default: "http://127.0.0.1:3178" },
    output: { type: "string", default: ".sync/tmp-opening-rewrite" },
    browser: { type: "string", default: "C:/Program Files/Google/Chrome/Application/chrome.exe" },
    help: { type: "boolean" },
  },
})
if (values.help) {
  console.log(
    "node scripts/opening-preview.mjs [--url URL] [--output DIR] [--browser EXE]\nRequires Playwright (or PLAYWRIGHT_MODULE pointing to its installed ESM entry). Uses headless Chrome and local API fixtures.",
  )
  process.exit(0)
}
const playwrightModule = process.env.PLAYWRIGHT_MODULE ?? "playwright"
const { chromium } = await import(
  path.isAbsolute(playwrightModule) ? pathToFileURL(playwrightModule).href : playwrightModule
)
const output = path.resolve(values.output)
await mkdir(path.join(output, "videos"), { recursive: true })
const browser = await chromium.launch({ executablePath: values.browser, headless: true })
const report = { browser: browser.version(), url: values.url, cases: [], failures: [] }
const save = () => writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2))

async function visit(
  name,
  {
    width = 1440,
    height = 900,
    reduced = false,
    saveData = false,
    twoG = false,
    noWebGL = false,
    imageDelay = 0,
    imageFailure = false,
    slow = false,
    route = "/",
    mobile = false,
    javascript = true,
    frames = false,
    video = false,
  } = {},
  verify = async () => {},
) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: reduced ? "reduce" : "no-preference",
    javaScriptEnabled: javascript,
    ...(mobile
      ? {
          userAgent:
            "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
          isMobile: true,
          hasTouch: true,
        }
      : {}),
    ...(video
      ? { recordVideo: { dir: path.join(output, "videos"), size: { width, height } } }
      : {}),
  })
  // External APIs are not an opening readiness dependency. Empty local responses
  // isolate animation and navigation from account credentials and remote uptime.
  await context.route("**/api/music**", (request) => request.fulfill({ json: { songs: [] } }))
  await context.route("**/anime/latest.json", (request) =>
    request.fulfill({ status: 503, body: "local startup acceptance" }),
  )
  await context.route("**/api/anime", (request) =>
    request.fulfill({ status: 503, body: "local startup acceptance" }),
  )
  await context.route("**/api/papers**", (request) =>
    request.fulfill({ json: { reports: [], latest: null, issues: [] } }),
  )
  if (imageDelay || imageFailure)
    await context.route(
      /(?:convict-lake-day-study|observation-room-open).*\.webp/,
      async (request) => {
        if (imageFailure) await request.abort("failed")
        else {
          await new Promise((resolve) => setTimeout(resolve, imageDelay))
          await request.continue()
        }
      },
    )
  await context.addInitScript(
    ({ saveData, twoG, noWebGL }) => {
      if (saveData || twoG)
        Object.defineProperty(navigator, "connection", {
          configurable: true,
          value: { saveData, effectiveType: twoG ? "2g" : "4g" },
        })
      if (noWebGL) {
        const original = HTMLCanvasElement.prototype.getContext
        HTMLCanvasElement.prototype.getContext = function (name, ...args) {
          if (String(name).startsWith("webgl")) return null
          return original.call(this, name, ...args)
        }
      }
      const evidence = (window.__openingEvidence = {
        gaps: [],
        phases: [],
        artwork: [],
        longTasks: [],
      })
      let previous = 0
      function sample(now) {
        if (previous) evidence.gaps.push(now - previous)
        previous = now
        if (document.documentElement.dataset.startupPhase !== "ready") requestAnimationFrame(sample)
      }
      requestAnimationFrame(sample)
      window.addEventListener("site-startup-phase", () =>
        evidence.phases.push({
          phase: document.documentElement.dataset.startupPhase,
          at: performance.now(),
        }),
      )
      new MutationObserver(() => {
        const artwork = document.querySelector("[data-home-artwork-kind]")
        const status = artwork?.dataset.homeArtwork,
          kind = artwork?.dataset.homeArtworkKind
        if (status && evidence.artwork.at(-1)?.status !== status)
          evidence.artwork.push({ status, kind, at: performance.now() })
      }).observe(document, {
        childList: true,
        attributes: true,
        subtree: true,
        attributeFilter: ["data-home-artwork"],
      })
      try {
        new PerformanceObserver((list) =>
          evidence.longTasks.push(
            ...list.getEntries().map(({ startTime, duration }) => ({ startTime, duration })),
          ),
        ).observe({ type: "longtask", buffered: true })
      } catch {
        /* optional diagnostic */
      }
    },
    { saveData, twoG, noWebGL },
  )
  const page = await context.newPage(),
    requests = [],
    errors = []
  page.on("request", (request) => requests.push(request.url()))
  page.on("pageerror", (error) => errors.push(error.message))
  if (slow) {
    const cdp = await context.newCDPSession(page)
    await cdp.send("Network.enable")
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 80,
      downloadThroughput: 1024 * 1024,
      uploadThroughput: 256 * 1024,
    })
  }
  try {
    await page.goto(new URL(route, values.url).href, { waitUntil: "domcontentloaded" })
    if (frames) {
      await page.waitForFunction(() => performance.getEntriesByName("site:opening").length)
      for (const at of [0, 250, 850, 1450, 1950]) {
        await page.waitForFunction(
          (at) =>
            performance.now() - performance.getEntriesByName("site:opening")[0].startTime >= at,
          at,
        )
        await page.screenshot({ path: path.join(output, `${name}-${at}.png`) })
        if (
          at === 1950 &&
          (await page.locator("html").getAttribute("data-startup-phase")) === "exiting"
        )
          assert.ok(
            await page
              .locator("[data-site-ui]")
              .evaluateAll((elements) =>
                elements.every(
                  (element) => element.inert || element.closest("[data-startup-inert]"),
                ),
              ),
            "background input is locked during crossfade",
          )
      }
    }
    await verify(page, context)
    if (javascript)
      await page.waitForFunction(
        () => document.documentElement.classList.contains("splash-seen"),
        null,
        { timeout: 15000 },
      )
    await page.screenshot({ path: path.join(output, `${name}-ready.png`) })
    const metrics = javascript
      ? await page.evaluate(() => {
          const mark = (name) => performance.getEntriesByName(name).at(-1)?.startTime
          const start = mark("site:opening"),
            exit = mark("site:exiting"),
            ready = mark("site:ready")
          const evidence = window.__openingEvidence
          const gaps = evidence.gaps.toSorted((a, b) => a - b)
          return {
            opening: start,
            exit,
            ready,
            presentationMs: start !== undefined ? ready - start : undefined,
            crossfadeMs: exit !== undefined ? ready - exit : undefined,
            frameGapP95: gaps[Math.floor(gaps.length * 0.95)],
            maxFrameGap: Math.max(0, ...gaps),
            phases: evidence.phases,
            artwork: evidence.artwork,
            longTasks: evidence.longTasks,
            inert: document.querySelectorAll("[data-startup-inert]").length,
          }
        })
      : {}
    assert.equal(errors.length, 0, errors.join("\n"))
    assert.equal(
      requests.some((url) => url.includes("alpha-opening")),
      false,
    )
    if (javascript) assert.equal(metrics.inert, 0, "startup restores input")
    if (
      metrics.opening !== undefined &&
      !reduced &&
      !saveData &&
      !twoG &&
      name !== "skip" &&
      name !== "route-cancel"
    ) {
      assert.ok(metrics.presentationMs >= 2350, "normal opening keeps the full presentation")
      assert.ok(metrics.presentationMs < 5250, "bounded readiness wait")
    }
    const item = {
      name,
      viewport: `${width}x${height}`,
      passed: true,
      metrics,
      requests: requests.length,
    }
    report.cases.push(item)
    console.log(JSON.stringify(item))
  } catch (error) {
    report.failures.push({ name, message: error.message })
    await page.screenshot({ path: path.join(output, `${name}-FAILED.png`) }).catch(() => {})
    console.error(name, error.message)
  } finally {
    const recording = page.video()
    await context.close()
    if (recording) await recording.saveAs(path.join(output, `${name}.webm`))
    await save()
  }
}

try {
  for (const [width, height] of [
    [1440, 900],
    [1920, 1080],
    [1280, 800],
    [1024, 768],
  ])
    await visit(`cold-${width}`, { width, height, frames: true, video: width === 1440 })
  await visit("warm-reload", {}, async (page) => {
    await page.waitForFunction(() => document.documentElement.classList.contains("splash-seen"))
    await page.reload({ waitUntil: "domcontentloaded" })
    await page.waitForFunction(() => performance.getEntriesByName("site:opening").length)
  })
  await visit("slow-network", { slow: true })
  await visit("static-fallback", { noWebGL: true }, async (page) => {
    await page.waitForFunction(() => document.documentElement.classList.contains("splash-seen"))
    assert.equal(
      await page.locator("[data-home-artwork-kind]").getAttribute("data-home-artwork-kind"),
      "static-fallback",
    )
    assert.equal(
      await page.locator("[data-home-artwork-kind]").getAttribute("data-home-artwork"),
      "ready",
    )
  })
  await visit("delayed-poster", { noWebGL: true, imageDelay: 2500 }, async (page) => {
    await page.waitForFunction(() => performance.getEntriesByName("site:opening").length)
    await page.waitForFunction(
      () => performance.now() - performance.getEntriesByName("site:opening")[0].startTime > 1800,
    )
    assert.notEqual(await page.locator("html").getAttribute("data-startup-phase"), "ready")
  })
  await visit(
    "failed-images-retry",
    { noWebGL: true, imageFailure: true },
    async (page, context) => {
      await page.waitForFunction(() => document.documentElement.classList.contains("splash-seen"))
      assert.equal(
        await page.locator("[data-home-artwork-kind]").getAttribute("data-home-artwork"),
        "error",
      )
      await context.unroute(/(?:convict-lake-day-study|observation-room-open).*\.webp/)
      await page.getByRole("button", { name: "重新加载图片" }).click()
      await page.waitForFunction(
        () => document.querySelector("[data-home-artwork-kind]")?.dataset.homeArtwork === "ready",
      )
    },
  )
  await visit("skip", {}, async (page) => {
    await page.waitForSelector("[data-started]")
    await page.getByRole("button", { name: "跳过开场" }).click()
    await page.waitForFunction(() => document.documentElement.classList.contains("splash-seen"))
    assert.ok(
      await page.evaluate(
        () =>
          performance.getEntriesByName("site:ready")[0].startTime -
            performance.getEntriesByName("site:opening")[0].startTime <
          1500,
      ),
    )
  })
  for (const [name, options] of [
    ["reduced-motion", { reduced: true }],
    ["save-data", { saveData: true }],
    ["two-g", { twoG: true }],
  ])
    await visit(name, options, async (page) => {
      await page.waitForFunction(() => document.documentElement.classList.contains("splash-seen"))
      const duration = await page.evaluate(
        () =>
          performance.getEntriesByName("site:ready")[0].startTime -
          performance.getEntriesByName("site:exiting")[0].startTime,
      )
      assert.ok(duration < 500, "static presentation uses a short fade")
    })
  await visit("route-cancel", {}, async (page) => {
    await page.waitForSelector("[data-started]")
    await page
      .locator('a[href="/about"]')
      .first()
      .evaluate((link) => link.click())
    await page.waitForURL("**/about")
    await page.waitForFunction(() => document.documentElement.classList.contains("splash-seen"))
    await page.goBack()
    await page.waitForURL(new URL("/", values.url).href)
    assert.equal(await page.evaluate(() => performance.getEntriesByName("site:opening").length), 1)
  })
  await visit("direct-inner-page", { route: "/about" })
  await visit("mobile-redirect", { mobile: true }, async (page) => {
    await page.waitForURL("**/blog/**")
  })
  await visit("no-javascript", { javascript: false }, async (page) => {
    assert.ok(await page.getByRole("link", { name: "进入笔记" }).isVisible())
    assert.equal(await page.locator("[data-startup-loading]").isVisible(), false)
  })
} finally {
  await browser.close()
  await save()
}
console.log(JSON.stringify({ passed: report.cases.length, failures: report.failures, output }))
if (report.failures.length) process.exitCode = 1
