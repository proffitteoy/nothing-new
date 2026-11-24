import * as THREE from "three"

// Keep the shipped room and project camera in their original coordinates.
export const DESK_POSITION = new THREE.Vector3(-0.62, 1.9, 2.72)
export const DESK_TARGET = new THREE.Vector3(0.08, 1.06, -0.5)
export const HOME_POSITION = new THREE.Vector3(0, 1.575, 2)
export const HOME_TARGET = new THREE.Vector3(0, 1.575, 2.4)
export const REAR_WINDOW_Z = 2.4
export const HOME_FOV = THREE.MathUtils.radToDeg(2 * Math.atan((3.15 * 0.53) / 0.4))

const roomPoints = [
  HOME_POSITION,
  new THREE.Vector3(0, 1.7, 1.3),
  new THREE.Vector3(0, 1.9, 0.6),
  new THREE.Vector3(0, 1.9, 0.9),
  new THREE.Vector3(-0.3, 1.9, 1.9),
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
const roomDirections = roomPoints.map((point, i) =>
  orientation(point, i < 3 ? HOME_TARGET : DESK_TARGET),
)
const portraitDirection = orientation(new THREE.Vector3(-0.75, 2.3, 4.8), DESK_TARGET)
const lakeDirections = lakePoints.map((point, i) =>
  orientation(
    point,
    i === 0 ? HOME_TARGET : new THREE.Vector3(point.x, point.y - 0.05 * i, point.z + 2),
  ),
)

// Back away from the actual rear glazing, turn inside the original room, then
// back through that same opening to the unchanged project camera.
export function directWorldCamera(camera: THREE.PerspectiveCamera, progress: number) {
  const room = progress < 0,
    t = Math.min(1, Math.max(0, Math.abs(progress)))
  const fov = room
    ? t <= 0.4
      ? THREE.MathUtils.lerp(HOME_FOV, 110, THREE.MathUtils.smoothstep(t, 0, 0.4))
      : THREE.MathUtils.lerp(110, 47, THREE.MathUtils.smoothstep(t, 0.4, 0.8))
    : THREE.MathUtils.lerp(HOME_FOV, 47, THREE.MathUtils.smoothstep(t, 0, 0.4))
  const far = progress > 0 ? 700 : 35
  if (camera.fov !== fov || camera.far !== far) {
    camera.fov = fov
    camera.far = far
    camera.updateProjectionMatrix()
  }
  const curve = room ? roomCurve : lakeCurve
  curve.getPoint(t, camera.position)
  const directions = room ? roomDirections : lakeDirections
  const segment = t * (directions.length - 1)
  const index = Math.min(directions.length - 2, Math.floor(segment))
  const blend = segment - index
  camera.quaternion.slerpQuaternions(
    directions[index],
    directions[index + 1],
    blend * blend * (3 - 2 * blend),
  )
  if (room && camera.aspect < 1) {
    const portrait = THREE.MathUtils.smoothstep(t, 0.8, 1)
    camera.position.x -= 0.13 * portrait
    camera.position.y += 0.4 * portrait
    camera.position.z += 2.08 * portrait
    camera.quaternion.slerp(portraitDirection, portrait)
  }
}
