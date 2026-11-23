import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import * as THREE from "three"
import { Reflector } from "three/addons/objects/Reflector.js"
import { buildCabinWorld } from "./cabin-world"
import { directWorldCamera, HOME_POSITION, PROJECT_TRANSFORM } from "./world-camera"

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
  const ray = new THREE.Raycaster(HOME_POSITION, new THREE.Vector3(0, 0, -1), 0, 3)
  assert.ok(ray.intersectObject(wall).length > 0, "original sky panel/mullion blocks passage")
  const originalIndex = (wall as THREE.Mesh).geometry.index!.count

  const scene = new THREE.Scene()
  scene.add(model)
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
    assert.ok(scene.getObjectByName("original-home-window")!.visible)
    assert.ok(scene.getObjectByName("home-room-interior")!.visible)
  }
  assert.equal(scene.getObjectByName("cabin-pitched-roof"), undefined)
  model.applyMatrix4(PROJECT_TRANSFORM)
  scene.updateMatrixWorld(true)
  const lake = scene.getObjectByName("lake-water") as Reflector
  assert.ok(lake instanceof Reflector)
  assert.equal(lake.getRenderTarget().width, 768)
  assert.equal(lake.getRenderTarget().height, 768)
  assert.equal("photograph" in (lake.material as THREE.ShaderMaterial).uniforms, false)
  const camera = new THREE.PerspectiveCamera()
  const rearWindow = scene.getObjectByName("original-home-window")!
  directWorldCamera(camera, -1)
  const deskDirection = camera.getWorldDirection(new THREE.Vector3())
  camera.lookAt(rearWindow.position)
  assert.ok(
    camera.getWorldDirection(new THREE.Vector3()).dot(deskDirection) < -0.9,
    "looking back from the desk finds the original home window in this room",
  )
  for (const sign of [-1]) {
    const previous = HOME_POSITION.clone()
    for (let i = 1; i <= 10000; i++) {
      directWorldCamera(camera, (sign * i) / 10000)
      const direction = camera.position.clone().sub(previous)
      ray.set(previous, direction.clone().normalize())
      ray.far = direction.length() + 0.04
      const solids: THREE.Mesh[] = []
      scene.traverseVisible((object) => {
        if (object instanceof THREE.Mesh && object.name !== "original-home-window")
          solids.push(object)
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
    if (object instanceof Reflector) object.getRenderTarget().dispose()
    object.geometry.dispose()
    for (const material of Array.isArray(object.material) ? object.material : [object.material])
      material.dispose()
  })
})
