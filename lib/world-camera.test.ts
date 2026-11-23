import test from "node:test"
import assert from "node:assert/strict"
import * as THREE from "three"
import {
  directWorldCamera,
  HOME_POSITION,
  HOME_TARGET,
  DESK_POSITION,
  DESK_TARGET,
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

test("flight clears the doorway, pitched roof and rear window", () => {
  const camera = new THREE.PerspectiveCamera()
  let doors = 0,
    windows = 0,
    exterior = 0
  for (let i = 0; i <= 10000; i++) {
    directWorldCamera(camera, -i / 10000)
    const { x, y, z } = camera.position
    if (Math.abs(z - 4.2) < 0.1 && y < 3.25) {
      doors++
      assert.ok(Math.abs(x) < 0.72 && y < 2.48, "clear door jambs and header")
    }
    if (Math.abs(x) < 3.7 && z > -1.8 && z < 4.4 && y > 3)
      assert.ok(y > 4.22, "clear the pitched roof")
    if (y > 4.2 && Math.abs(x) > 4) exterior++
    directWorldCamera(camera, i / 10000)
    if (Math.abs(camera.position.z + 1.65) < 0.08) {
      windows++
      assert.ok(camera.position.x > -1.65 && camera.position.x < -0.33)
      assert.ok(camera.position.y > 1.35 && camera.position.y < 2.49)
    }
  }
  assert.ok(doors > 20 && windows > 20 && exterior > 1000)
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
