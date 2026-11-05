import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { createSpectralFieldRuntime } from "./SpectralFieldRuntime"

const runtimeSource = readFileSync(new URL("./SpectralFieldRuntime.ts", import.meta.url), "utf8")
const layoutSource = readFileSync(new URL("../../app/layout.tsx", import.meta.url), "utf8")

test("spectral runtime is detached from routing and obsolete performance mode", () => {
  assert.match(runtimeSource, /export function createSpectralFieldRuntime/)
  assert.match(runtimeSource, /requestAnimationFrame\(animate\)/)
  assert.match(runtimeSource, /cancelAnimationFrame\(animationFrame\)/)
  assert.match(runtimeSource, /fps < 42/)
  assert.match(runtimeSource, /lowFpsWindows >= 3/)
  assert.match(runtimeSource, /now - obstacleSampleAt >= 100/)
  assert.match(runtimeSource, /getBoundingClientRect\(\)/)
  assert.match(runtimeSource, /resizeCanvases\(\)/)
  assert.match(runtimeSource, /themeBlend \+=/)
  assert.match(runtimeSource, /obstacleObserver\.disconnect\(\)/)
  assert.match(runtimeSource, /themeObserver\.disconnect\(\)/)
  assert.doesNotMatch(runtimeSource, /usePathname|useFieldMode|performanceMode|FieldModeProvider|["']\/music["']/)
  assert.doesNotMatch(layoutSource, /FieldScene|SpectralFieldRuntime/)
})

test("server-side call never starts the spectral runtime", () => {
  assert.equal(
    createSpectralFieldRuntime({
      speciesCanvas: null as unknown as HTMLCanvasElement,
      backCanvas: null as unknown as HTMLCanvasElement,
      frontCanvas: null as unknown as HTMLCanvasElement,
      interactionCanvas: null as unknown as HTMLCanvasElement,
    }),
    null,
  )
})

test("disabled desktop runtime does not schedule RAF and releases all subscriptions", () => {
  const original = ["window", "document", "MutationObserver"].map((key) => [
    key,
    Object.getOwnPropertyDescriptor(globalThis, key),
  ] as const)
  let animationFrames = 0
  let subscriptions = 0
  let unsubscriptions = 0
  let observed = 0
  let disconnected = 0
  const media = () => ({
    matches: false,
    addEventListener: () => { subscriptions++ },
    removeEventListener: () => { unsubscriptions++ },
  })
  const mockWindow = {
    matchMedia: media,
    requestAnimationFrame: () => { animationFrames++; return 1 },
    cancelAnimationFrame: () => {},
    addEventListener: () => { subscriptions++ },
    removeEventListener: () => { unsubscriptions++ },
  }
  const spriteContext = {
    createRadialGradient: () => ({ addColorStop: () => {} }),
    fillRect: () => {},
  }
  const mockDocument = {
    documentElement: { classList: { contains: () => false } },
    body: {},
    visibilityState: "visible",
    createElement: () => ({ getContext: () => spriteContext }),
    querySelectorAll: () => [],
    addEventListener: () => { subscriptions++ },
    removeEventListener: () => { unsubscriptions++ },
  }
  class MockObserver {
    observe() { observed++ }
    disconnect() { disconnected++ }
  }
  try {
    for (const [key, value] of [
      ["window", mockWindow],
      ["document", mockDocument],
      ["MutationObserver", MockObserver],
    ] as const) {
      Object.defineProperty(globalThis, key, { configurable: true, value })
    }
    const canvas = () =>
      ({ width: 0, height: 0, getContext: () => ({}) }) as unknown as HTMLCanvasElement
    const speciesCanvas = canvas()
    const backCanvas = canvas()
    const frontCanvas = canvas()
    const interactionCanvas = canvas()
    const runtime = createSpectralFieldRuntime({
      speciesCanvas,
      backCanvas,
      frontCanvas,
      interactionCanvas,
    })
    assert.ok(runtime)
    assert.equal(animationFrames, 0, "desktop-only mode must not render on mobile")
    assert.equal(observed, 2, "obstacle and theme mutation observers are tracked")
    runtime.setDark(true)
    runtime.destroy()
    runtime.destroy()
    assert.equal(disconnected, 2)
    assert.equal(subscriptions, unsubscriptions)
    assert.deepEqual(
      [speciesCanvas.width, backCanvas.width, frontCanvas.width, interactionCanvas.width],
      [1, 1, 1, 1],
    )
  } finally {
    for (const [key, descriptor] of original) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else Reflect.deleteProperty(globalThis, key)
    }
  }
})
