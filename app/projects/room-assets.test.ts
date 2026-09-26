import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { projects, roomTargets } from "./projects"

const bytes = readFileSync(new URL("../../public/projects-room/study.glb", import.meta.url))
const jsonLength = bytes.readUInt32LE(12)
const gltf = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString("utf8")) as {
  nodes: { name?: string; mesh?: number; translation?: number[] }[]
  meshes: { primitives: { indices?: number; attributes: { POSITION: number } }[] }[]
  accessors: { count: number }[]
  buffers: { uri?: string }[]
  images: { uri?: string; bufferView?: number }[]
}

test("the shipped GLB is self-contained and within the agreed scene budget", () => {
  assert.equal(bytes.toString("ascii", 0, 4), "glTF")
  assert.equal(bytes.readUInt32LE(4), 2)
  assert.equal(bytes.readUInt32LE(8), bytes.length)
  assert.ok(bytes.length < 4 * 1024 * 1024, "model + embedded textures must remain below 4 MiB")
  assert.ok(
    gltf.buffers.every((buffer) => !buffer.uri),
    "no runtime dependency on remote model buffers",
  )
  assert.ok(
    gltf.images.every((image) => !image.uri && image.bufferView !== undefined),
    "textures are embedded",
  )
  const primitives = gltf.meshes.flatMap((mesh) => mesh.primitives)
  const triangles = primitives.reduce(
    (total, primitive) =>
      total + gltf.accessors[primitive.indices ?? primitive.attributes.POSITION].count / 3,
    0,
  )
  assert.ok(triangles < 100000, `all geometry, including hidden walls: ${triangles}`)
  assert.ok(primitives.length < 80, "asset primitives fit the draw call budget")
})

test("every accessible entry has both real geometry and a projection anchor in the exported asset", () => {
  const named = new Map(gltf.nodes.map((node) => [node.name, node]))
  for (const id of roomTargets) {
    assert.ok(named.get(id)?.mesh !== undefined, `${id} is clickable geometry`)
    assert.ok(named.has(`anchor_${id}`), `${id} has a label anchor`)
  }
  for (const wall of ["wall_back", "wall_left"]) assert.ok(named.get(wall)?.mesh !== undefined)
})

test("project migration preserves destinations, research status, and upstream attribution", () => {
  assert.equal(new Set(projects.map((project) => project.id)).size, 6)
  assert.deepEqual(
    projects
      .filter((project) => project.contribution)
      .map((project) => new URL(project.href).pathname)
      .sort(),
    ["/GUDHI/gudhi-devel", "/open-ani/animeko"],
  )
  assert.equal(projects.filter((project) => project.category.includes("论文在投")).length, 2)
  assert.ok(projects.every((project) => new URL(project.href).protocol === "https:"))
})
