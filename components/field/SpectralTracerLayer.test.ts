import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import ts from "typescript"
import {
  createSpectralTracerController,
  spectralDirectionAt,
  SPECTRAL_TRACER_BACKGROUND,
  SPECTRAL_TRACER_FOREGROUND,
  type SpectralTracerFrame,
} from "./SpectralTracerLayer"
import { SPECTRAL_LAMBDAS } from "./spectralField"

test("spectral flow keeps the six original eigenfrequencies and direction field", () => {
  const x = 321
  const y = 177
  const time = 0.6
  const w = 1200
  const h = 800
  const nx = (x / w) * 2 - 1
  const ny = (y / h) * 2 - 1
  const phase = nx * (w / h) + 2 * ny + SPECTRAL_LAMBDAS[0] * time + 0.31
  const cosine = Math.cos(phase)
  const correctedX = (2 * cosine) / (w / h)
  const expectedMagnitude = Math.hypot(correctedX, -cosine)
  const first = spectralDirectionAt(x, y, time, w, h, 1)
  assert.ok(Math.abs(first.x - correctedX / expectedMagnitude) < 1e-12)
  assert.ok(Math.abs(first.y + cosine / expectedMagnitude) < 1e-12)
  assert.notDeepEqual(
    spectralDirectionAt(x, y, time, w, h, 1),
    spectralDirectionAt(x, y, time, w, h, 6),
    "additional spectral eigenmodes must change the actual motion",
  )
})

test("long connected spectral curves remain visible and every article obstacle is protected", () => {
  class TestPath {
    segments = 0
    moveTo() {}
    lineTo() { this.segments++ }
  }
  const originalPath = Object.getOwnPropertyDescriptor(globalThis, "Path2D")
  Object.defineProperty(globalThis, "Path2D", { configurable: true, value: TestPath })
  const segments = [0, 0]
  const widths: number[][] = [[], []]
  const colours: string[][] = [[], []]
  const canvas = (layer: number) =>
    ({
      width: 0,
      height: 0,
      style: {},
      getContext: () => ({
        setTransform() {},
        clearRect() {},
        stroke(path: TestPath) {
          segments[layer] += path.segments
          if (path.segments) {
            widths[layer].push(this.lineWidth)
            colours[layer].push(this.strokeStyle)
          }
        },
      }),
    }) as unknown as HTMLCanvasElement

  try {
    const controller = createSpectralTracerController(canvas(0), canvas(1))
    assert.ok(controller)
    controller.resize(1200, 800, 1)
    const frame: SpectralTracerFrame = {
      alpha: 1,
      theme: 1,
      time: 0,
      backgroundCount: SPECTRAL_TRACER_BACKGROUND,
      foregroundCount: SPECTRAL_TRACER_FOREGROUND,
      trailSamples: 8,
      modeCount: 6,
      width: 1200,
      height: 800,
      obstacles: [],
    }
    controller.render(frame)
    assert.ok(segments[0] > 500, "immediately show hundreds of curved segments, not tiny moving dots")
    assert.ok(segments[1] > 100)
    assert.ok(widths[0].some((width) => width >= 2))
    assert.ok(widths[1].some((width) => width >= 2.7))

    segments.fill(0)
    controller.render({
      ...frame,
      time: 0.02,
      colours: [
        [74, 130, 192],
        [118, 103, 193],
        [201, 117, 150],
      ],
    })
    assert.ok(segments.every((value) => value > 0))
    assert.ok(colours[0].includes("rgb(74, 130, 192)"))

    segments.fill(0)
    controller.render({ ...frame, time: 0.03, foregroundCount: 0 })
    assert.ok(segments[0] > 0)
    assert.equal(segments[1], 0)

    segments.fill(0)
    controller.render({
      ...frame,
      time: 0.04,
      obstacles: [
        ...Array.from({ length: 16 }, () => ({
          left: 5000, top: 5000, right: 5100, bottom: 5100,
        })),
        { left: -1000, top: -1000, right: 2200, bottom: 1800 },
      ],
    })
    assert.deepEqual(segments, [0, 0], "the 17th obstacle must protect both layers")

    segments.fill(0)
    controller.render({ ...frame, time: 0.06 })
    assert.ok(segments.every((value) => value > 0), "removing obstacles restores spectral curves")

    segments.fill(0)
    controller.render({ ...frame, time: 0.07, alpha: 0 })
    assert.deepEqual(segments, [0, 0])
    controller.destroy()
    controller.render({ ...frame, time: 0.08 })
    assert.deepEqual(segments, [0, 0])
  } finally {
    if (originalPath) Object.defineProperty(globalThis, "Path2D", originalPath)
    else Reflect.deleteProperty(globalThis, "Path2D")
  }
})

test("the about obstacle belongs to the article, not the page grid", () => {
  const source = readFileSync(new URL("../AboutClient.tsx", import.meta.url), "utf8")
  const tree = ts.createSourceFile(
    "AboutClient.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const obstacles: ts.JsxElement[] = []
  const visit = (node: ts.Node) => {
    if (
      ts.isJsxElement(node) &&
      node.openingElement.attributes.properties.some(
        (attribute) =>
          ts.isJsxAttribute(attribute) && attribute.name.getText(tree) === "data-field-obstacle",
      )
    )
      obstacles.push(node)
    ts.forEachChild(node, visit)
  }
  visit(tree)
  assert.equal(obstacles.length, 1)
  assert.equal(obstacles[0].openingElement.tagName.getText(tree), "article")
  assert.match(obstacles[0].getText(tree), /dangerouslySetInnerHTML/)
})

test("friends protect readable panels without blocking the entire grid", () => {
  const source = readFileSync(
    new URL("../../app/friends/FriendsBoard.tsx", import.meta.url),
    "utf8",
  )
  const tree = ts.createSourceFile(
    "FriendsBoard.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const obstacles: ts.JsxElement[] = []
  const visit = (node: ts.Node) => {
    if (
      ts.isJsxElement(node) &&
      node.openingElement.attributes.properties.some(
        (attribute) =>
          ts.isJsxAttribute(attribute) && attribute.name.getText(tree) === "data-field-obstacle",
      )
    )
      obstacles.push(node)
    ts.forEachChild(node, visit)
  }
  visit(tree)
  assert.equal(obstacles.length, 3)
  assert.match(obstacles[0].getText(tree), /云端引力/)
  assert.equal(obstacles[1].openingElement.tagName.getText(tree), "a")
  assert.match(obstacles[1].openingElement.getText(tree), /href=\{friend.url\}/)
  assert.match(obstacles[2].getText(tree), /提交友链申请/)
  for (const obstacle of obstacles) {
    assert.doesNotMatch(obstacle.openingElement.getText(tree), /grid-cols|max-w-5xl/)
  }
})
