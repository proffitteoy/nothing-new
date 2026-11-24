import * as THREE from "three"

// Keep the shipped room and project camera in their original coordinates.
export const DESK_POSITION = new THREE.Vector3(-0.62, 1.9, 2.72)
export const DESK_TARGET = new THREE.Vector3(0.08, 1.06, -0.5)
export const HOME_POSITION = new THREE.Vector3(0, 1.92, 0.5)
export const HOME_TARGET = new THREE.Vector3(0, 1.92, 2.4)
// Join the actual side-wall ends (z=1.85), inside the existing floor footprint.
export const REAR_WINDOW_Z = 1.85
export const HOME_FOV = 47

const roomPoints = [
  HOME_POSITION,
  new THREE.Vector3(0, 1.92, 0.2),
  new THREE.Vector3(0, 1.92, 0),
  new THREE.Vector3(0, 1.9, 0.6),
  new THREE.Vector3(-0.3, 1.9, 1.7),
  DESK_POSITION,
]
const lakePoints = [
  HOME_POSITION,
  new THREE.Vector3(0, 1.8, 2.5),
  new THREE.Vector3(0, 1.85, 3),
  new THREE.Vector3(0.2, 1.4, 5.5),
  new THREE.Vector3(0.4, 0.7, 11),
  new THREE.Vector3(0, 0.32, 22),
]
const roomCurve = new THREE.CatmullRomCurve3(roomPoints, false, "centripetal")
const lakeCurve = new THREE.CatmullRomCurve3(lakePoints, false, "centripetal")
const matrix = new THREE.Matrix4(),
  up = new THREE.Vector3(0, 1, 0)
const orientation = (position: THREE.Vector3, target: THREE.Vector3) =>
  new THREE.Quaternion().setFromRotationMatrix(matrix.lookAt(position, target, up))
const homeDirection = orientation(HOME_POSITION, HOME_TARGET)
const deskDirection = orientation(DESK_POSITION, DESK_TARGET)
const portraitDirection = orientation(new THREE.Vector3(-0.75, 2.3, 4.8), DESK_TARGET)
const lakeDirection = orientation(lakePoints[5], new THREE.Vector3(0, 0.22, 24))
const ease = (value: number) => {
  const t = THREE.MathUtils.clamp(value, 0, 1)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

// Back away from the actual rear glazing, turn inside the original room, then
// back through that same opening to the unchanged project camera.
export function directWorldCamera(camera: THREE.PerspectiveCamera, progress: number) {
  const room = progress < 0,
    t = Math.min(1, Math.max(0, Math.abs(progress)))
  const fov = HOME_FOV
  const far = progress === -1 ? 35 : 700
  if (camera.fov !== fov || camera.far !== far) {
    camera.fov = fov
    camera.far = far
    camera.updateProjectionMatrix()
  }
  const curve = room ? roomCurve : lakeCurve
  curve.getPoint(t, camera.position)
  // One turn with continuous angular velocity/acceleration, rather than five
  // independently eased turns which stop at every spline control point.
  camera.quaternion.slerpQuaternions(
    homeDirection,
    room ? deskDirection : lakeDirection,
    room ? ease((t - 0.28) / 0.62) : ease(t),
  )
  if (room && camera.aspect < 1) {
    const portrait = THREE.MathUtils.smoothstep(t, 0.8, 1)
    camera.position.x -= 0.13 * portrait
    camera.position.y += 0.4 * portrait
    camera.position.z += 2.08 * portrait
    camera.quaternion.slerp(portraitDirection, portrait)
  }
}
