import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import ts from "typescript"
import {
  createSpectralTracerController,
  spectralDirectionAt,
  type SpectralTracerFrame,
} from "./SpectralTracerLayer"
import { SPECTRAL_LAMBDAS } from "./spectralField"

test("the original eigenmode field remains the only source of tracer velocity", () => {
  const x = 321
  const y = 177
  const time = 0.6
  const width = 1200
  const height = 800
  const aspect = width / height
  const phase = (x / width * 2 - 1) * aspect + 2 * (y / height * 2 - 1) +
    SPECTRAL_LAMBDAS[0] * time + 0.31
  const cosine = Math.cos(phase)
  const vx = 2 * cosine / aspect
  const vy = -cosine
  const magnitude = Math.hypot(vx, vy)
  const actual = spectralDirectionAt(x, y, time, width, height, 1)
  assert.ok(Math.abs(actual.x - vx / magnitude) < 1e-12)
  assert.ok(Math.abs(actual.y - vy / magnitude) < 1e-12)
  assert.notDeepEqual(actual, spectralDirectionAt(x, y, time, width, height, 6))
})

test("homepage long spectral curves render immediately, remain visible, and fade over time", () => {
  class TestPath {
    segments = 0
    moveTo() {}
    lineTo() { this.segments++ }
  }
  const savedPath = Object.getOwnPropertyDescriptor(globalThis, "Path2D")
  Object.defineProperty(globalThis, "Path2D", { configurable: true, value: TestPath })
  const paths = [0, 0]
  const widths: number[][] = [[], []]
  const colours: string[][] = [[], []]
  const composites: string[][] = [[], []]
  const canvas = (index: number) => ({
    width: 0,
    height: 0,
    style: {},
    getContext: () => ({
      globalCompositeOperation: "source-over",
      globalAlpha: 1,
      lineWidth: 1,
      strokeStyle: "",
      setTransform() {},
      clearRect() {},
      fillRect() { composites[index].push(this.globalCompositeOperation) },
      stroke(path: TestPath) {
        if (!path.segments) return
        paths[index] += path.segments
        widths[index].push(this.lineWidth)
        colours[index].push(this.strokeStyle)
      },
    }),
  }) as unknown as HTMLCanvasElement

  try {
    const controller = createSpectralTracerController(canvas(0), canvas(1))
    assert.ok(controller)
    controller.resize(1200, 800, 1)
    const frame: SpectralTracerFrame = {
      alpha: 2.8,
      theme: 1,
      time: 0.1,
      backgroundCount: 3200,
      foregroundCount: 120,
      trailSamples: 8,
      modeCount: 6,
      width: 1200,
      height: 800,
      obstacles: [],
      colours: [
        [74, 130, 192],
        [128, 96, 200],
        [206, 74, 131],
      ],
    }
    controller.render(frame)
    assert.ok(paths[0] > 1000, "long spectral streamlines must be visible on the first frame")
    assert.ok(paths[1] > 100, "foreground curves must be visible")
    assert.ok(widths[0].some((width) => width >= 1.9))
    assert.ok(widths[1].some((width) => width >= 2.4))
    assert.ok(colours[0].includes("rgb(74, 130, 192)"))

    paths.fill(0)
    controller.render({ ...frame, time: 0.115 })
    assert.ok(paths.every((count) => count > 0), "later frames add visible new path segments")
    assert.deepEqual(composites.map((list) => list.includes("destination-out")), [true, true])

    paths.fill(0)
    controller.render({
      ...frame,
      time: 0.13,
      obstacles: [
        ...Array.from({ length: 16 }, () => ({
          left: 5000, top: 5000, right: 5100, bottom: 5100,
        })),
        { left: -1000, top: -1000, right: 2200, bottom: 1800 },
      ],
    })
    assert.deepEqual(paths, [0, 0], "the seventeenth obstacle covers both layers")

    paths.fill(0)
    controller.render({ ...frame, time: 0.16 })
    assert.ok(paths.every((count) => count > 0), "removing the obstacle respawns curves")

    paths.fill(0)
    controller.render({ ...frame, time: 0, alpha: 0 })
    assert.deepEqual(paths, [0, 0])
    controller.destroy()

    // Only the homepage opts into the calm profile. Recycled particles must
    // grow their traces over subsequent frames instead of painting long lines
    // at an unrelated location in one frame.
    paths.fill(0)
    const ambientController = createSpectralTracerController(canvas(0), canvas(1))
    assert.ok(ambientController)
    ambientController.resize(1200, 800, 1)
    const ambientFrame: SpectralTracerFrame = {
      ...frame,
      motion: "ambient",
      obstacles: [],
    }
    ambientController.render(ambientFrame)
    assert.ok(paths[0] > 1000, "initial home streamlines remain visible")
    paths.fill(0)
    ambientController.render({
      ...ambientFrame,
      time: 0.115,
      obstacles: [{ left: -1000, top: -1000, right: 2200, bottom: 1800 }],
    })
    paths.fill(0)
    ambientController.render({ ...ambientFrame, time: 0.13 })
    assert.ok(paths[0] > 0 && paths[0] <= 320, "background respawns cannot flash long paths")
    assert.ok(paths[1] > 0 && paths[1] <= 40, "foreground respawns cannot flash long paths")
    ambientController.destroy()
  } finally {
    if (savedPath) Object.defineProperty(globalThis, "Path2D", savedPath)
    else Reflect.deleteProperty(globalThis, "Path2D")
  }
})

test("home canvas still consumes the six-mode spectral render path, not a separate noise field", () => {
  const home = readFileSync(new URL("../HomeSpectralCanvas.tsx", import.meta.url), "utf8")
  assert.match(home, /createSpectralTracerController\(back, front\)/)
  assert.match(home, /modeCount: 6/)
  assert.match(home, /SPECTRAL_PLAYBACK_RATE/)
  assert.match(home, /motion: "ambient"/)
  assert.match(home, /colours/)
  const tracer = readFileSync(new URL("./SpectralTracerLayer.tsx", import.meta.url), "utf8")
  assert.doesNotMatch(tracer, /createPerlinNoise|noise3\(/)
  assert.match(tracer, /FIELD_KX|FIELD_KY/)
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
