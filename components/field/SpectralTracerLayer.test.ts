import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import ts from "typescript"
import { createSpectralTracerController, type SpectralTracerFrame } from "./SpectralTracerLayer"

test("both tracer layers respect obstacles beyond the former 16-card limit", () => {
  class TestPath {
    segments = 0
    moveTo() {}
    lineTo() {
      this.segments++
    }
  }
  const originalPath = Object.getOwnPropertyDescriptor(globalThis, "Path2D")
  Object.defineProperty(globalThis, "Path2D", { configurable: true, value: TestPath })
  const counts = [0, 0]
  const canvas = (layer: number) =>
    ({
      style: {},
      getContext: () => ({
        setTransform() {},
        clearRect() {},
        stroke(path: TestPath) {
          counts[layer] += path.segments
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
      backgroundCount: 3200,
      foregroundCount: 120,
      trailSamples: 14,
      modeCount: 6,
      width: 1200,
      height: 800,
      obstacles: [],
    }
    controller.render(frame)
    assert.ok(
      counts.every((count) => count > 0),
      "unobstructed layers should draw",
    )

    counts.fill(0)
    controller.render({
      ...frame,
      obstacles: [
        ...Array.from({ length: 16 }, () => ({ left: 5000, top: 5000, right: 5100, bottom: 5100 })),
        { left: -1000, top: -1000, right: 2200, bottom: 1800 },
      ],
    })
    assert.deepEqual(counts, [0, 0], "the 17th obstacle must protect both layers")

    controller.render(frame)
    assert.ok(
      counts.every((count) => count > 0),
      "removed page obstacles must not remain cached",
    )
    controller.destroy()
  } finally {
    if (originalPath) Object.defineProperty(globalThis, "Path2D", originalPath)
    else Reflect.deleteProperty(globalThis, "Path2D")
  }
})

test("the about obstacle belongs to the card containing the article, not the page grid", () => {
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
  assert.match(obstacles[0].openingElement.getText(tree), /bg-white\/60/)
  assert.match(obstacles[0].getText(tree), /dangerouslySetInnerHTML/)
})

test("friend cards remain outside field avoidance", () => {
  const source = readFileSync(
    new URL("../../app/friends/FriendsBoard.tsx", import.meta.url),
    "utf8",
  )
  assert.doesNotMatch(source, /data-field-obstacle/)
})
