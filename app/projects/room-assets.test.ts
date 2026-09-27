import * as THREE from "three"
import { MeshBVH } from "three-mesh-bvh"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { projects, roomTargets } from "./projects"

const bytes = readFileSync(new URL("../../public/projects-room/study.glb", import.meta.url))
const nightBytes = readFileSync(
  new URL("../../public/projects-room/study-night.jpg", import.meta.url),
)
const jsonLength = bytes.readUInt32LE(12)
const gltf = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString("utf8")) as {
  nodes: { name?: string; mesh?: number; translation?: number[] }[]
  meshes: { primitives: { indices?: number; attributes: { POSITION: number } }[] }[]
  accessors: { count: number }[]
  materials: { extensions?: { KHR_materials_unlit?: object } }[]
  buffers: { uri?: string }[]
  images: { uri?: string; bufferView?: number }[]
}

test("the shipped GLB is self-contained and within the agreed scene budget", () => {
  assert.equal(bytes.toString("ascii", 0, 4), "glTF")
  assert.equal(bytes.readUInt32LE(4), 2)
  assert.equal(bytes.readUInt32LE(8), bytes.length)
  assert.ok(
    bytes.length + nightBytes.length < 4 * 1024 * 1024,
    "model + both light bakes must remain below 4 MiB",
  )
  assert.equal(nightBytes.readUInt16BE(0), 0xffd8, "night lightmap is a JPEG")
  assert.ok(
    gltf.materials.every((mat) => mat.extensions?.KHR_materials_unlit),
    "physically baked lighting must not be lit a second time at runtime",
  )
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
  for (const wall of ["wall_back", "wall_left", "wall_right"])
    assert.ok(named.get(wall)?.mesh !== undefined)
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

test("BVH selection agrees with independent triangle raycasts on the shipped room", () => {
  const asset = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString("utf8"))
  const binary = bytes.subarray(28 + jsonLength)
  function attribute(index: number, size: number) {
    const accessor = asset.accessors[index]
    const view = asset.bufferViews[accessor.bufferView]
    const data = new Float32Array(accessor.count * size)
    const elementBytes = accessor.componentType === 5123 ? 2 : 4
    for (let i = 0; i < accessor.count; i++) {
      for (let axis = 0; axis < size; axis++) {
        const offset =
          (view.byteOffset ?? 0) +
          (accessor.byteOffset ?? 0) +
          i * (view.byteStride ?? size * elementBytes) +
          axis * elementBytes
        data[i * size + axis] =
          accessor.componentType === 5126
            ? binary.readFloatLE(offset)
            : accessor.componentType === 5123
              ? binary.readUInt16LE(offset)
              : binary.readUInt32LE(offset)
      }
    }
    return data
  }
  let hits = 0
  for (const mesh of asset.meshes) {
    const primitive = mesh.primitives[0]
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(attribute(primitive.attributes.POSITION, 3), 3),
    )
    if (primitive.indices !== undefined)
      geometry.setIndex(Array.from(attribute(primitive.indices, 1)))
    const originalIndex = geometry.index?.array.slice()
    const tree = new MeshBVH(geometry, { indirect: true })
    assert.deepEqual(geometry.index?.array, originalIndex, "do not mutate shared GLB indices")
    const surface = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }),
    )
    geometry.computeBoundingBox()
    const box = geometry.boundingBox!
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    for (const axis of ["x", "y", "z"] as const) {
      for (const sign of [-1, 1]) {
        for (const offset of [-0.3, 0, 0.3]) {
          const origin = center.clone().addScaledVector(size, offset)
          origin[axis] = (sign > 0 ? box.max[axis] : box.min[axis]) + sign
          const ray = new THREE.Raycaster(origin, center.clone().sub(origin).normalize())
          const expected = ray.intersectObject(surface, false)[0]
          const actual = tree.raycastFirst(ray.ray, THREE.DoubleSide)
          assert.equal(Boolean(actual), Boolean(expected))
          if (actual && expected) {
            hits++
            assert.ok(Math.abs(actual.distance - expected.distance) < 1e-5)
          }
        }
      }
    }
    geometry.dispose()
    surface.material.dispose()
  }
  assert.ok(hits > 50, "exercise real surfaces from both sides")
})
