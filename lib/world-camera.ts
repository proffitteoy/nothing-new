import * as THREE from "three"

export const HOME_POSITION = new THREE.Vector3(-0.99, 1.92, -0.35)
export const HOME_TARGET = new THREE.Vector3(-0.99, 1.92, -2)
// One rigid placement for the only room. The home window is behind its desk
// camera; turning inside this room reveals the same physical workstation.
export const PROJECT_TRANSFORM = new THREE.Matrix4().makeRotationY(Math.PI)
PROJECT_TRANSFORM.setPosition(-1.61, 0, 5.2)
export const DESK_POSITION = new THREE.Vector3(-0.62, 1.9, 2.72).applyMatrix4(PROJECT_TRANSFORM)
export const DESK_TARGET = new THREE.Vector3(0.08, 1.06, -0.5).applyMatrix4(PROJECT_TRANSFORM)

const roomPoints = [
  HOME_POSITION,
  new THREE.Vector3(-0.99, 1.92, 0.35),
  new THREE.Vector3(-0.99, 1.91, 1.0),
  new THREE.Vector3(-0.99, 1.9, 1.65),
  new THREE.Vector3(-0.99, 1.9, 2.12),
  new THREE.Vector3(-0.99, 1.9, 2.4),
  DESK_POSITION,
]
const lakePoints = [
  HOME_POSITION,
  new THREE.Vector3(-0.99, 1.92, -1.65),
  new THREE.Vector3(-0.99, 1.85, -3),
  new THREE.Vector3(-0.8, 1.4, -5.5),
  new THREE.Vector3(-0.4, 0.7, -11),
  new THREE.Vector3(0, 0.32, -22),
]
const roomCurve = new THREE.CatmullRomCurve3(roomPoints, false, "centripetal")
const lakeCurve = new THREE.CatmullRomCurve3(lakePoints, false, "centripetal")
const matrix = new THREE.Matrix4(),
  up = new THREE.Vector3(0, 1, 0)
const orientation = (position: THREE.Vector3, target: THREE.Vector3) =>
  new THREE.Quaternion().setFromRotationMatrix(matrix.lookAt(position, target, up))
const windowDirection = orientation(HOME_POSITION, HOME_TARGET)
const finalDirection = orientation(DESK_POSITION, DESK_TARGET)
const lakeDirections = lakePoints.map((point, i) =>
  orientation(
    point,
    i === 0
      ? HOME_TARGET
      : new THREE.Vector3(
          point.x,
          point.y + 0.19 - (0.42 * i) / (lakePoints.length - 1),
          point.z - 1.65,
        ),
  ),
)

// Back away from the room's rear window, then turn towards its only desk.
// All positions remain at eye height inside the same room.
export function directWorldCamera(camera: THREE.PerspectiveCamera, progress: number) {
  const room = progress < 0,
    t = Math.min(1, Math.max(0, Math.abs(progress)))
  const curve = room ? roomCurve : lakeCurve
  curve.getPoint(t, camera.position)
  if (room) {
    camera.quaternion.slerpQuaternions(
      windowDirection,
      finalDirection,
      THREE.MathUtils.smoothstep(t, 0.58, 0.96),
    )
    return
  }
  const directions = lakeDirections
  const segment = t * (directions.length - 1)
  const index = Math.min(directions.length - 2, Math.floor(segment))
  const blend = segment - index
  camera.quaternion.slerpQuaternions(
    directions[index],
    directions[index + 1],
    blend * blend * (3 - 2 * blend),
  )
}
