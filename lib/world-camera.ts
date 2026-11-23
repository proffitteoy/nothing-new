import * as THREE from "three"

export const HOME_POSITION = new THREE.Vector3(-0.99, 1.92, -0.35)
export const HOME_TARGET = new THREE.Vector3(-0.99, 2.11, -2)
export const DESK_POSITION = new THREE.Vector3(-0.62, 1.9, 2.72)
export const DESK_TARGET = new THREE.Vector3(0.08, 1.06, -0.5)

const roomPoints = [
  HOME_POSITION,
  new THREE.Vector3(-0.99, 2, 0.9),
  new THREE.Vector3(-0.5, 2.08, 3.1),
  new THREE.Vector3(0, 2.05, 4.9),
  new THREE.Vector3(0.5, 7.2, 11.5),
  new THREE.Vector3(11, 7.8, 4.6),
  new THREE.Vector3(10, 7.2, -9),
  new THREE.Vector3(-10, 7.2, -9),
  new THREE.Vector3(-11, 7.8, 4.6),
  new THREE.Vector3(-0.5, 7.2, 11.5),
  new THREE.Vector3(0, 2.05, 4.9),
  new THREE.Vector3(-0.4, 1.96, 3.5),
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
const matrix = new THREE.Matrix4()
const up = new THREE.Vector3(0, 1, 0)
const orientation = (position: THREE.Vector3, target: THREE.Vector3) =>
  new THREE.Quaternion().setFromRotationMatrix(matrix.lookAt(position, target, up))
const roomDirections = roomPoints.map((point, i) =>
  orientation(point, i < 3 ? HOME_TARGET : i >= 10 ? DESK_TARGET : new THREE.Vector3(0, 1.4, 0)),
)
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

// Absolute sampling makes reversal identical at every point; there is no animation queue.
export function directWorldCamera(camera: THREE.PerspectiveCamera, progress: number) {
  const room = progress < 0
  const t = Math.min(1, Math.max(0, Math.abs(progress)))
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
}
