import * as THREE from "three"
import { MeshBVH } from "three-mesh-bvh"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import sharp from "sharp"
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

test("screen artwork survives export at its dedicated atlas resolution", async () => {
  const asset = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString("utf8"))
  const binary = bytes.subarray(28 + jsonLength)
  const image = asset.bufferViews[asset.images[0].bufferView]
  const metadata = await sharp(
    binary.subarray(image.byteOffset, image.byteOffset + image.byteLength),
  ).metadata()
  assert.equal(metadata.width, 4096)
  assert.equal(metadata.height, 4096)
  const regions = {
    competitions: [3072, 0, 1024, 576],
    iris: [3072, 592, 1024, 640],
    topp: [3072, 1248, 768, 1344],
  }
  for (const [name, [x, y, w, h]] of Object.entries(regions)) {
    const node = asset.nodes.find((node: { name: string }) => node.name === name)
    const uvAccessor = asset.accessors[asset.meshes[node.mesh].primitives[0].attributes.TEXCOORD_0]
    const view = asset.bufferViews[uvAccessor.bufferView]
    const uv = Array.from({ length: uvAccessor.count }, (_, i) => {
      const offset =
        (view.byteOffset ?? 0) + (uvAccessor.byteOffset ?? 0) + i * (view.byteStride ?? 8)
      return [binary.readFloatLE(offset), binary.readFloatLE(offset + 4)]
    })
    const housingUVs = uv.filter(([u, v]) => u < 0.75 && v < 0.75)
    assert.ok(
      new Set(housingUVs.map(([u, v]) => `${u},${v}`)).size > 100,
      `${name} retains the housing lightmap, not zero-filled detail UVs`,
    )
    for (const [u, v] of [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ])
      assert.ok(
        uv.some(([a, b]) => Math.abs(a - u / 4096) < 1e-6 && Math.abs(b - v / 4096) < 1e-6),
        `${name} keeps its screen corners outside the room light bake`,
      )
  }
})

test("the authored keyboard uses an ANSI layout with a populated reference library", () => {
  const details = JSON.parse(
    readFileSync(new URL("../../design/projects-room/study-details.json", import.meta.url), "utf8"),
  ) as {
    keys: { label: string; laptop: boolean; units: number }[]
    books: { id: string; title: string }[]
  }
  const keyboard = details.keys.filter((key) => !key.laptop)
  assert.equal(keyboard.length, 87)
  assert.equal(keyboard.find((key) => key.label === "")?.units, 6.25)
  assert.equal(keyboard.find((key) => key.label === "Backspace")?.units, 2)
  assert.equal(keyboard.find((key) => key.label === "Enter")?.units, 2.25)
  for (const label of ["F1", "F12", "↑", "↓", "←", "→", "Home", "PgDn"])
    assert.ok(keyboard.some((key) => key.label === label))
  assert.equal(details.books.length, 36)
  assert.equal(new Set(details.books.map((book) => book.id)).size, 36)
  assert.ok(details.books.every((book) => book.title.length > 0))
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
