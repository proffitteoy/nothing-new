import * as THREE from "three"

export const HOME_POSITION = new THREE.Vector3(-0.99, 1.92, -0.35)
export const HOME_TARGET = new THREE.Vector3(-0.99, 1.92, -2)
// Only the project room is placed beyond the rear glazing. Its local model and
// camera stay unchanged, so the final image remains the original project view.
export const PROJECT_TRANSFORM = new THREE.Matrix4().makeRotationY(Math.PI)
PROJECT_TRANSFORM.setPosition(0, 0, 8.8)
export const DESK_POSITION = new THREE.Vector3(-0.62, 1.9, 2.72).applyMatrix4(PROJECT_TRANSFORM)
export const DESK_TARGET = new THREE.Vector3(0.08, 1.06, -0.5).applyMatrix4(PROJECT_TRANSFORM)
export const HOME_DESK_POSITION = new THREE.Vector3(-0.62 + HOME_POSITION.x, 1.9, 2.72)
export const HOME_DESK_TARGET = new THREE.Vector3(0.08 + HOME_POSITION.x, 1.06, -0.5)

const roomPoints = [
  HOME_POSITION,
  new THREE.Vector3(-0.99, 1.92, 0.5),
  new THREE.Vector3(-1.3, 1.9, 1.6),
  HOME_DESK_POSITION,
  new THREE.Vector3(-1.5, 1.9, 3.6),
  new THREE.Vector3(-1.2, 1.9, 4.0),
  new THREE.Vector3(-0.2, 1.9, 4.9),
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
const deskDirection = orientation(HOME_DESK_POSITION, HOME_DESK_TARGET)
const finalDirection = orientation(DESK_POSITION, DESK_TARGET)
const roomDirections = [
  orientation(HOME_POSITION, HOME_TARGET),
  orientation(roomPoints[1], HOME_TARGET),
  orientation(roomPoints[2], HOME_DESK_TARGET),
  deskDirection,
  deskDirection,
  deskDirection,
  finalDirection,
  finalDirection,
]
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

// Window -> desk -> backwards to the rear glazing -> turn -> projects.
// All positions remain at eye height. There is no roof or exterior orbit.
export function directWorldCamera(camera: THREE.PerspectiveCamera, progress: number) {
  const room = progress < 0,
    t = Math.min(1, Math.max(0, Math.abs(progress)))
  const curve = room ? roomCurve : lakeCurve
  const directions = room ? roomDirections : lakeDirections
  curve.getPoint(t, camera.position)
  const segment = t * (directions.length - 1)
  const index = Math.min(directions.length - 2, Math.floor(segment))
  const blend = segment - index
  camera.quaternion.slerpQuaternions(
    directions[index],
    directions[index + 1],
    blend * blend * (3 - 2 * blend),
  )
  if (room && t >= 4 / 7)
    camera.quaternion.slerpQuaternions(
      deskDirection,
      finalDirection,
      THREE.MathUtils.smoothstep(t, 0.58, 0.75),
    )
}
