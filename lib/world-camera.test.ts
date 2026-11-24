import test from "node:test"
import assert from "node:assert/strict"
import * as THREE from "three"
import {
  directWorldCamera,
  HOME_POSITION,
  HOME_TARGET,
  DESK_POSITION,
  DESK_TARGET,
  REAR_WINDOW_Z,
  HOME_FOV,
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
    assert.equal(camera.fov, progress === 0 ? HOME_FOV : 47)
  }
  directWorldCamera(camera, 1)
  assert.ok(camera.position.y > 0.1 && camera.position.y < 0.5)
  assert.ok(camera.position.z > 20)
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
  directWorldCamera(camera, -0.2)
  assert.ok(camera.position.z < HOME_POSITION.z, "first move is backwards from the glazing")
  for (let i = 0; i <= 10000; i++) {
    const t = i / 10000
    directWorldCamera(camera, -t)
    assert.ok(camera.position.y >= 1.57 && camera.position.y <= 1.93, "no rise or roof view")
    assert.ok(Math.abs(camera.position.x) < 2.0, "no exterior orbit")
    assert.ok(camera.position.z > -1.6 && camera.position.z <= DESK_POSITION.z + 1e-8)
    if (t <= 0.4)
      assert.ok(
        camera.getWorldDirection(new THREE.Vector3()).z > 0.95,
        "keep looking at the rear window until the turn",
      )
  }
  assert.ok(camera.getWorldDirection(new THREE.Vector3()).dot(windowDirection) < -0.9)
  assert.ok(
    camera.position.z > REAR_WINDOW_Z,
    "original project camera is just outside the rear opening",
  )
  assert.ok(camera.position.distanceTo(new THREE.Vector3(-0.62, 1.9, 2.72)) < 1e-10)
})

test("the room turn keeps moving smoothly through the old rotation segment boundaries", () => {
  const camera = new THREE.PerspectiveCamera()
  const step = 0.0001
  for (const t of [0.4, 0.6, 0.8]) {
    directWorldCamera(camera, -t + step)
    const before = camera.quaternion.clone()
    directWorldCamera(camera, -t)
    const at = camera.quaternion.clone()
    directWorldCamera(camera, -t - step)
    const leftSpeed = before.angleTo(at) / step
    const rightSpeed = at.angleTo(camera.quaternion) / step
    assert.ok(leftSpeed > 1 && rightSpeed > 1, `turn must not stop at ${t}`)
    assert.ok(Math.abs(leftSpeed - rightSpeed) < 0.02, `continuous angular velocity at ${t}`)
  }
})

test("project endpoint preserves the original model-space desktop composition", () => {
  for (const aspect of [1.6, 0.875]) {
    const original = new THREE.PerspectiveCamera(47, aspect, 0.05, 35)
    original.position.set(
      aspect < 1 ? -0.75 : -0.62,
      aspect < 1 ? 2.3 : 1.9,
      aspect < 1 ? 4.8 : 2.72,
    )
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
      const projected = point.clone().project(actual)
      assert.ok(expected.distanceTo(projected) < 1e-10)
    }
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
