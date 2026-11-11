import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import ts from "typescript"
import {
  createSpectralTracerController,
  SPECTRAL_TRACER_BACKGROUND,
  SPECTRAL_TRACER_FOREGROUND,
  type SpectralTracerFrame,
} from "./SpectralTracerLayer"

test("flow-field particles advance persistently and protect every article obstacle", () => {
  class TestPath {
    segments = 0
    moveTo() {}
    lineTo() { this.segments++ }
  }
  const originalPath = Object.getOwnPropertyDescriptor(globalThis, "Path2D")
  Object.defineProperty(globalThis, "Path2D", { configurable: true, value: TestPath })
  const segments = [0, 0]
  const erased = [0, 0]
  const fills = [0, 0]
  const colours: string[][] = [[], []]
  const canvas = (layer: number) =>
    ({
      width: 0,
      height: 0,
      style: {},
      getContext: () => ({
        setTransform() {},
        clearRect() { erased[layer]++ },
        fillRect() { fills[layer]++ },
        stroke(path: TestPath) {
          segments[layer] += path.segments
          colours[layer].push(this.strokeStyle)
        },
      }),
    }) as unknown as HTMLCanvasElement

  try {
    const back = canvas(0)
    const front = canvas(1)
    const controller = createSpectralTracerController(back, front)
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
    assert.ok(segments.every((value) => value > 0), "both layers should move particles")
    assert.ok(fills.every((value) => value > 0), "both layers must fade old trails")

    segments.fill(0)
    controller.render(frame)
    assert.deepEqual(segments, [0, 0], "the same timestamp must not advance particles")

    controller.render({
      ...frame,
      time: 0.01,
      colours: [
        [74, 130, 192],
        [118, 103, 193],
        [201, 117, 150],
      ],
    })
    assert.ok(segments.every((value) => value > 0))
    assert.ok(colours[0].includes("rgb(74, 130, 192)"))

    segments.fill(0)
    controller.render({ ...frame, time: 0.02, foregroundCount: 0 })
    assert.ok(segments[0] > 0)
    assert.equal(segments[1], 0, "immersive pages can hide foreground particles")

    segments.fill(0)
    controller.render({
      ...frame,
      time: 0.03,
      obstacles: [
        ...Array.from({ length: 16 }, () => ({ left: 5000, top: 5000, right: 5100, bottom: 5100 })),
        { left: -1000, top: -1000, right: 2200, bottom: 1800 },
      ],
    })
    assert.deepEqual(segments, [0, 0], "the 17th obstacle must protect both layers")
    assert.ok(erased.every((value) => value >= 17), "persistent trails must be masked")

    segments.fill(0)
    controller.render({ ...frame, time: 0.04 })
    assert.ok(segments.every((value) => value > 0), "both layers must recover after obstacles leave")

    segments.fill(0)
    controller.render({ ...frame, time: 0.05, alpha: 0 })
    assert.deepEqual(segments, [0, 0], "reduced-motion requests must not render trails")
    controller.destroy()
    controller.render({ ...frame, time: 0.06 })
    assert.deepEqual(segments, [0, 0], "destroy must prevent further painting")
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
