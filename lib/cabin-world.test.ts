import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import * as THREE from "three"
import { buildCabinWorld, clearRearWindow } from "./cabin-world"
import { directWorldCamera, HOME_POSITION, REAR_WINDOW_Z } from "./world-camera"

test("home and projects share one physical room and one set of workstation objects", async () => {
  const bytes = readFileSync(new URL("../public/projects-room/study.glb", import.meta.url))
  const length = bytes.readUInt32LE(12)
  const asset = JSON.parse(bytes.subarray(20, 20 + length).toString("utf8")) as {
    nodes: { name: string; mesh?: number; translation?: number[]; rotation?: number[] }[]
    meshes: { primitives: { attributes: { POSITION: number }; indices: number }[] }[]
    accessors: { bufferView: number; byteOffset?: number; count: number; componentType: number }[]
    bufferViews: { byteOffset?: number; byteStride?: number }[]
  }
  const binary = bytes.subarray(28 + length)
  const attribute = (id: number, size: number) => {
    const accessor = asset.accessors[id],
      view = asset.bufferViews[accessor.bufferView]
    const result = new Float32Array(accessor.count * size)
    const width = accessor.componentType === 5123 ? 2 : 4
    for (let i = 0; i < accessor.count; i++)
      for (let axis = 0; axis < size; axis++) {
        const offset =
          (view.byteOffset ?? 0) +
          (accessor.byteOffset ?? 0) +
          i * (view.byteStride ?? size * width) +
          axis * width
        result[i * size + axis] =
          accessor.componentType === 5126
            ? binary.readFloatLE(offset)
            : accessor.componentType === 5123
              ? binary.readUInt16LE(offset)
              : binary.readUInt32LE(offset)
      }
    return result
  }
  const model = new THREE.Group()
  for (const node of asset.nodes) {
    if (node.mesh === undefined) continue
    const primitive = asset.meshes[node.mesh].primitives[0]
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(attribute(primitive.attributes.POSITION, 3), 3),
    )
    geometry.setIndex(Array.from(attribute(primitive.indices, 1)))
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }))
    mesh.name = node.name
    if (node.translation) mesh.position.fromArray(node.translation)
    if (node.rotation) mesh.quaternion.fromArray(node.rotation)
    model.add(mesh)
  }
  model.updateMatrixWorld(true)
  const wall = model.getObjectByName("wall_back")!
  const ray = new THREE.Raycaster()
  const originalIndex = (wall as THREE.Mesh).geometry.index!.count

  const scene = new THREE.Scene()
  scene.add(model)
  const room = model.getObjectByName("room") as THREE.Mesh
  const down = new THREE.Vector3(0, -1, 0)
  const propHeight = (x: number, z: number) =>
    new THREE.Raycaster(new THREE.Vector3(x, 2, z), down).intersectObject(room)[0].point.y
  assert.ok(propHeight(0.93, 1.52) > 0.4)
  assert.ok(propHeight(1.56, 1.65) > 1.4)
  clearRearWindow(model)
  assert.ok(propHeight(0.93, 1.52) < 0.01, "chair removed from window opening")
  assert.ok(propHeight(1.56, 1.65) < 0.01, "standing lamp removed from window opening")
  assert.ok(propHeight(-0.22, -0.5) > 0.7, "desk stays intact")
  const originalObjects = [...model.children]
  const load = THREE.TextureLoader.prototype.loadAsync
  THREE.TextureLoader.prototype.loadAsync = async () => new THREE.Texture()
  let world: Awaited<ReturnType<typeof buildCabinWorld>>
  try {
    world = await buildCabinWorld(scene, model)
  } finally {
    THREE.TextureLoader.prototype.loadAsync = load
  }
  assert.equal(
    (wall as THREE.Mesh).geometry.index!.count,
    originalIndex,
    "do not cut or rebuild the project model",
  )
  assert.ok(scene.getObjectByName("rear-floor-window"))
  assert.equal(scene.getObjectByName("home-desk-interior"), undefined)
  for (const original of originalObjects) {
    const matching: THREE.Object3D[] = []
    scene.traverse((object) => {
      if (object.name === original.name) matching.push(object)
    })
    assert.deepEqual(matching, [original], `only the original ${original.name}, no mirrored copy`)
  }
  for (const progress of [-0.1, -0.5, -0.8, -1]) {
    world.update(progress, 0, new THREE.Vector2(), false)
    assert.ok(model.visible, "the same room stays present throughout the turn")
    assert.equal(scene.getObjectByName("home-compositor")!.visible, false)
  }
  assert.equal(scene.getObjectByName("cabin-pitched-roof"), undefined)
  assert.ok(
    model.matrix.equals(new THREE.Matrix4()),
    "the project model stays in its original coordinates",
  )
  for (const name of [
    "interior-floor-extension",
    "interior-left-return",
    "interior-right-return",
    "interior-ceiling",
  ])
    assert.equal(scene.getObjectByName(name), undefined, "no hall or added room")
  scene.updateMatrixWorld(true)
  assert.equal(scene.getObjectByName("near-ground"), undefined, "no new foreground block")
  const lake = scene.getObjectByName("lake-water") as THREE.Mesh
  const mountains = scene.getObjectByName("distant-mountains") as THREE.Mesh
  assert.ok(lake instanceof THREE.Mesh)
  assert.equal(
    (lake.material as THREE.RawShaderMaterial).fragmentShader,
    (mountains.material as THREE.RawShaderMaterial).fragmentShader,
    "one landscape sampling path",
  )
  const exterior = lake.material as THREE.RawShaderMaterial
  assert.equal(exterior.transparent, false, "no second landscape alpha crossfade")
  assert.equal(
    exterior.uniforms.uInteriorOpacity.value,
    0,
    "the landscape never contains a room photograph",
  )
  world.resize(1440, 900)
  const waterVertices = lake.geometry.getAttribute("position")
  const landVertices = mountains.geometry.getAttribute("position")
  for (let i = 0; i < waterVertices.count; i++)
    assert.ok(Math.abs(waterVertices.getY(i)) < 1e-6, "water is a horizontal world plane")
  for (let i = 0; i <= 80; i++) {
    const a = new THREE.Vector3().fromBufferAttribute(waterVertices, i)
    const b = new THREE.Vector3().fromBufferAttribute(landVertices, landVertices.count - 81 + i)
    assert.ok(a.distanceTo(b) < 1e-5, "the bank and lake meet without a second photograph")
  }
  const camera = new THREE.PerspectiveCamera()
  assert.equal(
    scene.getObjectByName("original-home-window"),
    undefined,
    "no landscape photograph at the glazing",
  )
  const rearWindow = scene.getObjectByName("rear-window-rail")!
  assert.equal(rearWindow.position.z, REAR_WINDOW_Z)
  assert.ok(rearWindow.position.y < 0.05, "glazing reaches the floor")
  for (const p of [-0.000001, -0.01, -0.03, 0.000001, 0.01, 0.03, 0.1, 0.5, 1]) {
    world.update(p, 0, new THREE.Vector2(), false)
    assert.equal(
      scene.getObjectByName("home-compositor")!.visible,
      false,
      "no full-home overlay at any point after departure",
    )
  }
  world.update(-1, 0, new THREE.Vector2(), false)
  for (const sign of [-1]) {
    const previous = HOME_POSITION.clone()
    for (let i = 1; i <= 10000; i++) {
      directWorldCamera(camera, (sign * i) / 10000)
      const direction = camera.position.clone().sub(previous)
      ray.set(previous, direction.clone().normalize())
      ray.far = direction.length() + 0.04
      const solids: THREE.Mesh[] = []
      scene.traverseVisible((object) => {
        if (object instanceof THREE.Mesh && object.name !== "home-compositor") solids.push(object)
      })
      const hit = ray.intersectObjects(solids, false)[0]
      assert.equal(
        hit?.object.name,
        undefined,
        `camera clips ${hit?.object.name} at progress ${(sign * i) / 10000}`,
      )
      previous.copy(camera.position)
    }
  }
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    object.geometry.dispose()
    for (const material of Array.isArray(object.material) ? object.material : [object.material])
      material.dispose()
  })
})
