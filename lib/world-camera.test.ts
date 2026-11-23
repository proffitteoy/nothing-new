import test from "node:test"
import assert from "node:assert/strict"
import * as THREE from "three"
import {
  directWorldCamera,
  HOME_POSITION,
  HOME_TARGET,
  DESK_POSITION,
  DESK_TARGET,
  PROJECT_TRANSFORM,
} from "./world-camera"
import { dampWorldProgress } from "./home-scene"

test("camera endpoints match the home window and original project camera exactly", () => {
  const camera = new THREE.PerspectiveCamera(47, 1.6, 0.05, 700)
  for (const [progress, position, target] of [
    [0, HOME_POSITION, HOME_TARGET],
    [-1, DESK_POSITION, DESK_TARGET],
  ] as const) {
    directWorldCamera(camera, progress)
    const expected = camera.clone()
    expected.position.copy(position)
    expected.lookAt(target)
    assert.ok(camera.position.distanceTo(position) < 1e-10)
    assert.ok(camera.quaternion.angleTo(expected.quaternion) < 1e-7)
    assert.equal(camera.fov, 47)
  }
  directWorldCamera(camera, 1)
  assert.ok(camera.position.y > 0.1 && camera.position.y < 0.5)
  assert.ok(camera.position.z < -20)
})

test("both camera branches are continuous and exactly reversible", () => {
  const camera = new THREE.PerspectiveCamera()
  for (const sign of [-1, 1]) {
    let previous: THREE.PerspectiveCamera | null = null
    const poses: { p: number; position: THREE.Vector3; quaternion: THREE.Quaternion }[] = []
    for (let i = 0; i <= 2000; i++) {
      const p = (sign * i) / 2000
      directWorldCamera(camera, p)
      if (previous) {
        assert.ok(camera.position.distanceTo(previous.position) < 0.2)
        assert.ok(camera.quaternion.angleTo(previous.quaternion) < 0.035)
      }
      poses.push({ p, position: camera.position.clone(), quaternion: camera.quaternion.clone() })
      previous = camera.clone()
    }
    for (const pose of poses.reverse()) {
      directWorldCamera(camera, pose.p)
      assert.ok(camera.position.equals(pose.position))
      assert.ok(camera.quaternion.equals(pose.quaternion))
    }
  }
  directWorldCamera(camera, -1e-9)
  const junction = camera.clone()
  directWorldCamera(camera, 1e-9)
  assert.ok(camera.position.distanceTo(junction.position) < 1e-6)
  assert.ok(camera.quaternion.angleTo(junction.quaternion) < 1e-7)
})

test("backtrack leaves the rear window and turns towards the same room's desk", () => {
  const camera = new THREE.PerspectiveCamera()
  const windowDirection = HOME_TARGET.clone().sub(HOME_POSITION).normalize()
  let previousZ = HOME_POSITION.z
  for (let i = 0; i <= 10000; i++) {
    const t = i / 10000
    directWorldCamera(camera, -t)
    assert.ok(camera.position.y >= 1.89 && camera.position.y <= 1.93, "no rise or roof view")
    assert.ok(Math.abs(camera.position.x) < 2.0, "no exterior orbit")
    assert.ok(camera.position.z >= previousZ - 1e-8, "back away from the rear window")
    assert.ok(camera.position.z <= DESK_POSITION.z + 1e-8, "stay in the same room")
    previousZ = camera.position.z
    if (t <= 0.58)
      assert.ok(
        camera.getWorldDirection(new THREE.Vector3()).dot(windowDirection) > 0.999,
        "keep looking at the rear window until the turn",
      )
  }
  assert.ok(camera.getWorldDirection(new THREE.Vector3()).dot(windowDirection) < -0.9)
  const localCamera = camera.position.clone().applyMatrix4(PROJECT_TRANSFORM.clone().invert())
  assert.ok(localCamera.distanceTo(new THREE.Vector3(-0.62, 1.9, 2.72)) < 1e-10)
})

test("project endpoint preserves the original model-space desktop composition", () => {
  const original = new THREE.PerspectiveCamera(47, 1.6, 0.05, 700)
  original.position.set(-0.62, 1.9, 2.72)
  original.lookAt(0.08, 1.06, -0.5)
  original.updateMatrixWorld()
  const actual = original.clone()
  directWorldCamera(actual, -1)
  actual.updateMatrixWorld()
  for (const point of [
    new THREE.Vector3(0, 0.74, -0.5),
    new THREE.Vector3(-1, 1, -1),
    new THREE.Vector3(1, 1.5, -0.3),
  ]) {
    const expected = point.clone().project(original)
    const projected = point.clone().applyMatrix4(PROJECT_TRANSFORM).project(actual)
    assert.ok(expected.distanceTo(projected) < 1e-10)
  }
})

test("damping is refresh-rate independent and reverses smoothly mid-flight", () => {
  const samples = [60, 90, 120, 144].map((hz) => {
    let current = 0
    for (let i = 0; i < hz / 2; i++) current = dampWorldProgress(current, 1, 1 / hz)
    return current
  })
  for (const value of samples) assert.ok(Math.abs(value - samples[0]) < 1e-12)
  const next = dampWorldProgress(0.4, -1, 1 / 60)
  assert.ok(next < 0.4 && next > -1)
  assert.equal(dampWorldProgress(0.4, -1, 0), 0.4)
})
