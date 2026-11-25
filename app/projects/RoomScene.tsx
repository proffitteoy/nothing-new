"use client"

import { memo, useEffect, useLayoutEffect, useRef } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { Reflector } from "three/addons/objects/Reflector.js"
import { MeshBVH } from "three-mesh-bvh"
import { preloadRoomAssets } from "./room-preload"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { lifeObjects, projects, roomTargets, type RoomTarget } from "./projects"
import styles from "./room.module.css"
import { useHomeProjectState } from "../../components/HomeProjectNavigation"
import { buildCabinWorld, clearRearWindow } from "../../lib/cabin-world"
import { directWorldCamera, DESK_TARGET } from "../../lib/world-camera"
import { SPECTRAL_PLAYBACK_RATE } from "../../components/field/spectralField"

export type RoomSceneProps = {
  reduceMotion: boolean
  rotationEnabled: boolean
  wheelNavigation: boolean
  paused: boolean
  showLabels: boolean
  resetKey: number
  onReady: () => void
  onError: () => void
  onChoose: (target: RoomTarget) => void
}

type PreparedRoom = {
  model: THREE.Group
  trees: Map<THREE.Mesh, MeshBVH>
}
function disposeModel(root: THREE.Object3D, extraTextures: Iterable<THREE.Texture> = []) {
  const materials = new Set<THREE.Material>()
  const textures = new Set(extraTextures)
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    if (object instanceof Reflector) object.getRenderTarget().dispose()
    object.geometry.dispose()
    for (const mat of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(mat)
      for (const value of Object.values(mat))
        if (value instanceof THREE.Texture) textures.add(value)
      if (mat instanceof THREE.ShaderMaterial)
        for (const uniform of Object.values(mat.uniforms))
          if (uniform.value instanceof THREE.Texture) textures.add(uniform.value)
    }
  })
  for (const mat of materials) mat.dispose()
  for (const texture of textures) {
    const bitmap = texture.source.data
    if (typeof ImageBitmap !== "undefined" && bitmap instanceof ImageBitmap) bitmap.close()
    texture.dispose()
  }
}
async function prepareRoom(unified: boolean): Promise<PreparedRoom> {
  const data = await preloadRoomAssets()
  const { scene: model } = await new GLTFLoader().parseAsync(data, "/projects-room/")
  try {
    if (unified) clearRearWindow(model)
    const meshes: THREE.Mesh[] = []
    model.traverse((node) => {
      if (node instanceof THREE.Mesh) meshes.push(node)
    })
    const trees = new Map<THREE.Mesh, MeshBVH>()
    for (const mesh of meshes) {
      await new Promise((resolve) => setTimeout(resolve, 0))
      trees.set(mesh, new MeshBVH(mesh.geometry, { indirect: true }))
    }
    return { model, trees }
  } catch (error) {
    disposeModel(model)
    throw error
  }
}
// This component owns all GPU resources. React owns the accessible text layer.
// Music progress rerenders ProjectsBoard; only scene prop changes cross this boundary.
export const UnifiedScene = memo(function UnifiedScene(props: RoomSceneProps) {
  const navigation = useHomeProjectState()
  const navigationRef = useRef(navigation)
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const latest = useRef(props)
  const controller = useRef<{
    update: () => void
    highlight: (id: RoomTarget | null) => void
  } | null>(null)

  useEffect(() => {
    navigationRef.current = navigation
    latest.current = props
    controller.current?.update()
  }, [props, navigation])

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return
    const unified = navigationRef.current.enabled
    const reduceMedia = matchMedia("(prefers-reduced-motion: reduce)")
    const isReduced = () => latest.current.reduceMotion || reduceMedia.matches
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: unified ? "high-performance" : "low-power",
      })
    } catch {
      latest.current.onError()
      return
    }
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(47, 1, 0.05, unified ? 700 : 35)
    const controls = new OrbitControls(camera, canvas)
    controls.enablePan = false
    controls.minPolarAngle = 0.45
    controls.maxPolarAngle = Math.PI / 2 - 0.18
    controls.enableDamping = !isReduced()
    controls.dampingFactor = 0.12
    controls.rotateSpeed = 0.65
    controls.zoomSpeed = 0.65
    controls.target.set(0, 1.1, 0)
    // Window lighting is baked in Cycles: shadow detail without per-frame lights.
    const nodeGeometry = new THREE.SphereGeometry(0.004, 8, 6)
    const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0xafd9e9, toneMapped: false })
    const signalNodes = new THREE.InstancedMesh(nodeGeometry, nodeMaterial, 7)
    const nodePoints = [
      [-0.45, 0.09],
      [-0.5, 0.14],
      [-0.4, 0.14],
      [-0.535, 0.18],
      [-0.475, 0.18],
      [-0.425, 0.18],
      [-0.365, 0.18],
    ]
    nodePoints.forEach(([x, z], index) =>
      signalNodes.setMatrixAt(index, new THREE.Matrix4().makeTranslation(x, 0.759, -z)),
    )
    signalNodes.visible = false
    scene.add(signalNodes)
    let signalStarted = 0
    let worldTime: { value: number } | null = null
    let world: Awaited<ReturnType<typeof buildCabinWorld>> | null = null
    const homePointer = new THREE.Vector2(),
      homeLook = new THREE.Vector2()
    let visibleTime = 0
    let idleTimer: ReturnType<typeof setTimeout> | undefined
    let previousFree = false
    let returnStarted = 0
    const returnPosition = new THREE.Vector3()
    const returnQuaternion = new THREE.Quaternion()

    let model: THREE.Group | null = null
    let disposed = false
    let ready = false
    let reportedReady = false
    let frame = 0
    let lastFrame = 0
    let animateUntil = 0
    let highlighted: RoomTarget | null = null
    let resetKey = latest.current.resetKey
    let mobile = false
    const media = window.matchMedia("(max-width: 767px), (pointer: coarse)")
    const ray = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const projected = new THREE.Vector3()
    const worldPosition = new THREE.Vector3()
    const meshes: THREE.Mesh[] = []
    const occluders = new Map<THREE.Mesh, THREE.Box3>()
    const hitTrees = new Map<THREE.Mesh, MeshBVH>()
    const localRay = new THREE.Ray()
    const localHit = new THREE.Vector3()
    const inverse = new THREE.Matrix4()
    const bakedTextures = new Set<THREE.Texture>()
    const targets = new Map<RoomTarget, THREE.Object3D>()
    const anchors = new Map<RoomTarget, THREE.Object3D>()
    const basePositions = new Map<THREE.Object3D, THREE.Vector3>()
    const buttons = new Map<RoomTarget, HTMLElement>()
    const walls: {
      object: THREE.Mesh
      material: THREE.MeshBasicMaterial
      axis: "x" | "z"
      sign: number
    }[] = []
    for (const id of roomTargets) {
      const button = host.querySelector<HTMLElement>(`[data-room-hotspot="${id}"]`)
      if (button) buttons.set(id, button)
    }

    function release(root: THREE.Object3D) {
      disposeModel(root, bakedTextures)
    }

    function resetCamera() {
      const portrait = host!.clientWidth / Math.max(host!.clientHeight, 1) < 1
      controls.minDistance = portrait ? 3.1 : 2.4
      controls.maxDistance = portrait ? 7 : 5.8
      if (unified && navigationRef.current.mode !== "free") {
        directWorldCamera(camera, navigationRef.current.progress.current)
        return
      }
      // Human-scale view: eyes above the desktop, looking slightly down into the room.
      camera.position.set(portrait ? -0.75 : -0.62, portrait ? 2.3 : 1.9, portrait ? 4.8 : 2.72)
      controls.target.set(0.08, 1.06, -0.5)
      controls.update()
    }

    function schedule() {
      if (!frame && !disposed && document.visibilityState === "visible")
        frame = requestAnimationFrame(render)
    }

    function targetFor(object: THREE.Object3D): RoomTarget | null {
      for (let node: THREE.Object3D | null = object; node; node = node.parent) {
        if (roomTargets.includes(node.name as RoomTarget)) return node.name as RoomTarget
      }
      return null
    }

    function selectableMeshes() {
      return meshes.filter((mesh) => {
        if (mesh.name === "home-compositor") return false
        for (let node: THREE.Object3D | null = mesh; node; node = node.parent)
          if (!node.visible) return false
        return !(mesh.material instanceof THREE.MeshBasicMaterial) || mesh.material.opacity > 0.5
      })
    }

    // Static local BVHs accelerate both label occlusion and pointer selection.
    // Transform each ray into the mesh's baked local space, so hover lifts stay correct.
    function closestHit() {
      let closest: { distance: number; object: THREE.Mesh } | null = null
      for (const mesh of selectableMeshes()) {
        inverse.copy(mesh.matrixWorld).invert()
        localRay.copy(ray.ray).applyMatrix4(inverse)
        const bound = occluders.get(mesh)
        if (!bound || !localRay.intersectBox(bound, localHit)) continue
        const side = Array.isArray(mesh.material) ? THREE.DoubleSide : mesh.material.side
        const hit = hitTrees.get(mesh)?.raycastFirst(localRay, side)
        if (!hit) continue
        localHit.copy(hit.point)
        const distance = localHit.applyMatrix4(mesh.matrixWorld).distanceTo(ray.ray.origin)
        if (!closest || distance < closest.distance) closest = { distance, object: mesh }
      }
      return closest
    }

    function updateLabels() {
      const width = host!.clientWidth
      const height = host!.clientHeight
      const occupied: { left: number; right: number; top: number; bottom: number }[] = []
      for (const [id, anchor] of anchors) {
        const button = buttons.get(id)
        if (!button) continue
        if (unified && navigationRef.current.progress.current !== -1) {
          button.hidden = true
          const leader = host!.querySelector<SVGLineElement>(`[data-room-leader="${id}"]`)
          if (leader) leader.style.display = "none"
          continue
        }
        anchor.getWorldPosition(worldPosition)
        projected.copy(worldPosition).project(camera)
        let visible =
          projected.z > -1 &&
          projected.z < 1 &&
          Math.abs(projected.x) < 0.94 &&
          Math.abs(projected.y) < 0.9
        if (visible) {
          const distance = camera.position.distanceTo(worldPosition)
          ray.set(camera.position, worldPosition.clone().sub(camera.position).normalize())
          const hit = closestHit()
          visible = !hit || hit.distance > distance - 0.045 || targetFor(hit.object) === id
        }
        button.hidden = !visible
        const leader = host!.querySelector<SVGLineElement>(`[data-room-leader="${id}"]`)
        if (leader) leader.style.display = "none"
        if (!visible) continue
        const originalX = ((projected.x + 1) * width) / 2
        const originalY = ((1 - projected.y) * height) / 2
        const label = button.querySelector<HTMLElement>("span:last-child")
        const halfWidth = latest.current.showLabels
          ? Math.max(24, (label?.offsetWidth ?? 0) / 2)
          : 24
        const topSpace = latest.current.showLabels ? 34 + (label?.offsetHeight ?? 0) : 24
        const offsets = [0, -50, 50, -100, 100, -150, 150, -200, 200]
        let position: { x: number; y: number } | null = null
        for (const dy of offsets) {
          for (const dx of [0, -60, 60, -120, 120]) {
            const x = Math.max(
              halfWidth + 8,
              Math.min(width - halfWidth - (mobile ? 55 : 8), originalX + dx),
            )
            const y = Math.max(topSpace + 15, Math.min(height - 160, originalY + dy))
            const rect = {
              left: x - halfWidth,
              right: x + halfWidth,
              top: y - topSpace,
              bottom: y + 24,
            }
            if (
              occupied.some(
                (other) =>
                  rect.left < other.right + 3 &&
                  rect.right > other.left - 3 &&
                  rect.top < other.bottom + 3 &&
                  rect.bottom > other.top - 3,
              )
            )
              continue
            occupied.push(rect)
            position = { x, y }
            break
          }
          if (position) break
        }
        if (!position) {
          button.hidden = true
          continue
        }
        button.style.transform = `translate(${position.x}px,${position.y}px) translate(-50%,-50%)`
        if (leader && Math.hypot(position.x - originalX, position.y - originalY) > 6) {
          leader.setAttribute("x1", String(originalX))
          leader.setAttribute("y1", String(originalY))
          leader.setAttribute("x2", String(position.x))
          leader.setAttribute("y2", String(position.y))
          leader.style.display = "block"
        }
      }
    }

    function render(now: number) {
      frame = 0
      if (disposed || document.visibilityState !== "visible") return
      // Moving frames target 30Hz on narrow touch layouts; static scenes have no RAF loop.
      if (!unified && mobile && now - lastFrame < 30) {
        schedule()
        return
      }
      const elapsed = lastFrame ? Math.max(0, (now - lastFrame) / 1000) : 0
      const dt = Math.min(elapsed, 0.05)
      lastFrame = now
      const narrative = unified && navigationRef.current.mode !== "free"
      const moved = narrative ? false : controls.update()
      const before = camera.position.clone()
      if (narrative) {
        directWorldCamera(camera, navigationRef.current.progress.current)
        if (returnStarted) {
          const t = isReduced() ? 1 : Math.min(1, (now - returnStarted) / 350)
          const blend = t * t * (3 - 2 * t)
          camera.position.lerpVectors(returnPosition, camera.position, blend)
          camera.quaternion.slerpQuaternions(returnQuaternion, camera.quaternion, blend)
          if (t === 1) returnStarted = 0
        }
      }
      if (unified && (!narrative || returnStarted) && camera.far !== 700) {
        camera.far = 700
        camera.updateProjectionMatrix()
      }
      if (document.documentElement.dataset.startupPhase === "ready" && !isReduced())
        visibleTime += elapsed
      if (worldTime && !isReduced()) worldTime.value = visibleTime * SPECTRAL_PLAYBACK_RATE
      homeLook.lerp(homePointer, -Math.expm1(-10 * dt))
      if (narrative && !isReduced()) {
        // Pointer observation moves the actual eye. Architecture, shoreline
        // and reflections therefore share the same perspective/parallax.
        const weight =
          1 - THREE.MathUtils.smoothstep(Math.abs(navigationRef.current.progress.current), 0, 0.25)
        camera.position.add(
          new THREE.Vector3(homeLook.x * 0.012, -homeLook.y * 0.008, 0)
            .applyQuaternion(camera.quaternion)
            .multiplyScalar(weight),
        )
      }
      world?.update(navigationRef.current.progress.current, visibleTime, homeLook, true, camera)
      let changing = false
      const wallCamera = camera.position
      for (const wall of walls) {
        const outside = wallCamera[wall.axis] * wall.sign > (wall.axis === "x" ? 1.95 : 1.5)
        const goal = outside ? 0 : 1
        const difference = goal - wall.material.opacity
        wall.material.opacity = isReduced()
          ? goal
          : Math.abs(difference) < 0.015
            ? goal
            : wall.material.opacity + difference * Math.min(dt * 12, 1)
        const transparent = wall.material.opacity < 0.995
        if (wall.material.transparent !== transparent) {
          wall.material.transparent = transparent
          wall.material.depthWrite = !transparent
          wall.material.needsUpdate = true
        }
        wall.object.visible = wall.material.opacity > 0.005
        changing ||= Math.abs(goal - wall.material.opacity) > 0.005
      }
      for (const [id, object] of targets) {
        const base = basePositions.get(object)!
        const active = id === highlighted && !latest.current.paused
        const lift =
          active && ["rumor", "gudhi", "animeko"].includes(id) && !isReduced() ? 0.008 : 0
        object.position.y = base.y + (id === "rumor" ? lift : 0)
        object.position.z = base.z + (["gudhi", "animeko"].includes(id) ? lift * 2 : 0)
        const mesh = object as THREE.Mesh
        if (mesh.material instanceof THREE.MeshBasicMaterial) {
          mesh.material.color.set(active ? 0xc7dcff : 0xffffff)
        }
      }
      signalNodes.visible = highlighted === "rumor" && !latest.current.paused
      if (signalNodes.visible) {
        signalNodes.count = isReduced()
          ? 7
          : Math.min(7, 1 + Math.floor((now - signalStarted) / 100))
        changing ||= signalNodes.count < 7
      }
      if (model && ready) {
        model.updateMatrixWorld(true)
        renderer.render(scene, camera)
        if (!reportedReady) {
          reportedReady = true
          latest.current.onReady()
        }
        updateLabels()
        // Standard DOM diagnostics; no global debug API or persistent counters.
        canvas!.dataset.triangles = String(renderer.info.render.triangles)
        canvas!.dataset.drawCalls = String(renderer.info.render.calls)
        if (unified) {
          canvas!.dataset.cameraPosition = camera.position
            .toArray()
            .map((n) => n.toFixed(5))
            .join(",")
          canvas!.dataset.cameraQuaternion = camera.quaternion
            .toArray()
            .map((n) => n.toFixed(6))
            .join(",")
          canvas!.dataset.homeArtwork = "ready"
        }
      }
      clearTimeout(idleTimer)
      if (
        moved ||
        changing ||
        now < animateUntil ||
        returnStarted ||
        (narrative && !before.equals(camera.position)) ||
        homeLook.distanceToSquared(homePointer) > 0.000001
      )
        schedule()
      else if (unified && ready && !isReduced()) idleTimer = setTimeout(schedule, 1000 / 20)
    }

    function update() {
      if (disposed) return
      mobile = media.matches
      const free = navigationRef.current.mode === "free"
      const interactive =
        !latest.current.paused && (unified ? free : !mobile || latest.current.rotationEnabled)
      if (unified && free && !previousFree) {
        controls.target.copy(DESK_TARGET)
        controls.update()
      }
      if (unified && !free && previousFree) {
        returnPosition.copy(camera.position)
        returnQuaternion.copy(camera.quaternion)
        returnStarted = performance.now()
      }
      previousFree = free
      controls.enabled = interactive
      controls.enableZoom = !latest.current.wheelNavigation || latest.current.rotationEnabled
      controls.enableDamping = !isReduced()
      canvas!.style.touchAction = mobile && !latest.current.rotationEnabled ? "pan-y" : "none"
      if (resetKey !== latest.current.resetKey && !returnStarted) {
        resetKey = latest.current.resetKey
        resetCamera()
      }
      schedule()
    }

    function highlight(id: RoomTarget | null) {
      if (id === "rumor" && highlighted !== id) signalStarted = performance.now()
      highlighted = id
      for (const [target, button] of buttons) button.dataset.active = String(target === id)
      schedule()
    }

    function resize() {
      const wasMobile = mobile
      mobile = media.matches
      const width = host!.clientWidth
      const height = host!.clientHeight
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.75))
      renderer.setSize(width, height, false)
      const aspect = width / Math.max(height, 1)
      const orientationChanged = camera.aspect < 1 !== aspect < 1
      camera.aspect = aspect
      camera.updateProjectionMatrix()
      world?.resize(width, height)
      if (world)
        scene.getObjectByName("home-interior-world")?.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return
          object.geometry.computeBoundingBox()
          occluders.set(object, object.geometry.boundingBox!.clone())
          hitTrees.set(object, new MeshBVH(object.geometry, { indirect: true }))
        })
      if (!ready || wasMobile !== mobile || orientationChanged) resetCamera()
      update()
    }

    function hitAt(event: PointerEvent) {
      if (!model) return null
      if (unified && navigationRef.current.progress.current !== -1) return null
      const rect = canvas!.getBoundingClientRect()
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      )
      ray.setFromCamera(pointer, camera)
      const hit = closestHit()
      return hit ? targetFor(hit.object) : null
    }
    let pointerDown: { x: number; y: number; id: number } | null = null
    let dragged = false
    function down(event: PointerEvent) {
      if (pointerDown || !event.isPrimary) {
        dragged = true
        return
      }
      pointerDown = { x: event.clientX, y: event.clientY, id: event.pointerId }
      dragged = false
    }
    function move(event: PointerEvent) {
      homePointer.set(
        (event.clientX / innerWidth - 0.5) * 2,
        (event.clientY / innerHeight - 0.5) * 2,
      )
      if (
        pointerDown &&
        Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 6
      )
        dragged = true
      if (event.pointerType === "mouse" && !pointerDown && !latest.current.paused) {
        const id = hitAt(event)
        highlight(id)
        canvas!.style.cursor = id ? "pointer" : "grab"
      }
    }
    function up(event: PointerEvent) {
      if (pointerDown?.id === event.pointerId && !dragged && !latest.current.paused) {
        const id = hitAt(event)
        if (id) latest.current.onChoose(id)
      }
      pointerDown = null
      animateUntil = isReduced() ? 0 : performance.now() + 700
      schedule()
    }
    function cancel() {
      pointerDown = null
      dragged = true
      highlight(null)
    }
    function leave() {
      homePointer.set(0, 0)
      highlight(null)
    }
    function visibility() {
      lastFrame = performance.now()
      if (document.visibilityState === "hidden") {
        clearTimeout(idleTimer)
        cancelAnimationFrame(frame)
        frame = 0
      } else schedule()
    }
    function lost(event: Event) {
      event.preventDefault()
      ready = false
      clearTimeout(idleTimer)
      cancelAnimationFrame(frame)
      frame = 0
      latest.current.onError()
    }
    function change() {
      schedule()
    }
    controller.current = { update, highlight }
    controls.addEventListener("change", change)
    const scrollRoot = document.getElementById("app-scroll-root")
    scrollRoot?.addEventListener("home-project-frame", schedule)
    reduceMedia.addEventListener("change", update)
    canvas.addEventListener("pointerdown", down)
    canvas.addEventListener("pointermove", move)
    canvas.addEventListener("pointerup", up)
    canvas.addEventListener("pointercancel", cancel)
    canvas.addEventListener("pointerleave", leave)
    canvas.addEventListener("webglcontextlost", lost)
    document.addEventListener("visibilitychange", visibility)
    const observer = new ResizeObserver(resize)
    observer.observe(host)
    resize()

    void prepareRoom(unified)
      .then(async (room) => {
        if (disposed) {
          disposeModel(room.model)
          room.trees.clear()
          return
        }
        model = room.model
        for (const [mesh, tree] of room.trees) hitTrees.set(mesh, tree)
        scene.add(model)
        if (unified) {
          world = await buildCabinWorld(scene, model)
          world.resize(host.clientWidth, host.clientHeight)
          world.update(navigationRef.current.progress.current, visibleTime, homeLook, false, camera)
          worldTime = world.time
        }
        if (disposed) {
          disposeModel(scene)
          return
        }
        model.updateMatrixWorld(true)
        const sourceMaterials = new Set<THREE.Material>()
        model.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            meshes.push(object)
            // Independent feedback/opacity; a single physically lit texture for the room.
            sourceMaterials.add(object.material as THREE.Material)
            object.material = (object.material as THREE.MeshBasicMaterial).clone()
            const mat = object.material as THREE.MeshBasicMaterial
            mat.side = THREE.DoubleSide
            mat.toneMapped = false
            if (mat.map) bakedTextures.add(mat.map)
            object.geometry.computeBoundingBox()
            occluders.set(object, object.geometry.boundingBox!.clone())

            if (object.name.startsWith("wall_")) {
              walls.push({
                object,
                material: mat,
                axis: object.name === "wall_back" ? "z" : "x",
                sign: object.name === "wall_right" ? 1 : -1,
              })
            }
          }
        })
        if (unified) {
          scene.getObjectByName("home-interior-world")?.traverse((object) => {
            if (!(object instanceof THREE.Mesh)) return
            meshes.push(object)
            object.geometry.computeBoundingBox()
            occluders.set(object, object.geometry.boundingBox!.clone())
            hitTrees.set(object, new MeshBVH(object.geometry, { indirect: true }))
          })
        }
        for (const material of sourceMaterials) material.dispose()
        for (const id of roomTargets) {
          const object = model.getObjectByName(id)
          const anchor = model.getObjectByName(`anchor_${id}`)
          if (!object || !anchor) throw new Error(`Missing room object: ${id}`)
          targets.set(id, object)
          basePositions.set(object, object.position.clone())
          anchors.set(id, anchor)
        }
        await renderer.compileAsync(scene, camera)
        if (disposed) return
        ready = true
        update()
        // The render callback reports readiness after its first successful draw.
      })
      .catch((error: unknown) => {
        if (!disposed) {
          console.error("Study scene could not load", error)
          latest.current.onError()
        }
      })

    return () => {
      disposed = true
      clearTimeout(idleTimer)
      cancelAnimationFrame(frame)
      observer.disconnect()
      controls.removeEventListener("change", change)
      controls.dispose()
      controller.current = null
      canvas.removeEventListener("pointerdown", down)
      canvas.removeEventListener("pointermove", move)
      canvas.removeEventListener("pointerup", up)
      canvas.removeEventListener("pointercancel", cancel)
      canvas.removeEventListener("pointerleave", leave)
      canvas.removeEventListener("webglcontextlost", lost)
      document.removeEventListener("visibilitychange", visibility)
      scrollRoot?.removeEventListener("home-project-frame", schedule)
      reduceMedia.removeEventListener("change", update)
      if (model) release(scene)
      else
        for (const texture of bakedTextures) {
          ;(texture.source.data as ImageBitmap).close()
          texture.dispose()
        }
      hitTrees.clear()
      occluders.clear()
      nodeGeometry.dispose()
      nodeMaterial.dispose()
      renderer.dispose()
      // Strict Mode reuses the connected canvas immediately after effect cleanup.
      // Losing that context asynchronously would also kill the replacement renderer.
      queueMicrotask(() => {
        if (!canvas.isConnected) renderer.forceContextLoss()
      })
    }
  }, [])

  return (
    <div
      ref={hostRef}
      className={`${styles.scene} ${navigation.enabled ? styles.unified : ""}`}
      data-unified-scene={navigation.enabled || undefined}
      data-labels={props.showLabels}
      inert={props.paused}
    >
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        data-world-canvas={navigation.enabled || undefined}
        data-home-canvas={navigation.enabled || undefined}
        data-home-artwork={navigation.enabled ? "loading" : undefined}
        aria-hidden="true"
      />
      <svg className={styles.leaders} aria-hidden="true">
        {roomTargets.map((id) => (
          <line key={id} data-room-leader={id} />
        ))}
      </svg>
      <div className={styles.hotspots}>
        {projects.map((project, index) => (
          <button
            key={project.id}
            hidden
            data-room-hotspot={project.id}
            className={styles.hotspot}
            aria-label={`${project.label}：${project.description}`}
            onPointerEnter={() => controller.current?.highlight(project.id)}
            onPointerLeave={() => controller.current?.highlight(null)}
            onFocus={() => controller.current?.highlight(project.id)}
            onBlur={() => controller.current?.highlight(null)}
            onClick={() => props.onChoose(project.id)}
          >
            <span className={styles.dot}>{String(index + 1).padStart(2, "0")}</span>
            <span className={styles.hotspotLabel}>
              <strong>{project.label}</strong>
              <small>
                {project.object} · {project.contribution ? "开源贡献" : "项目"}
              </small>
            </span>
          </button>
        ))}
        {lifeObjects.map((object) => (
          <button
            key={object.id}
            hidden
            data-room-hotspot={object.id}
            className={`${styles.hotspot} ${styles.lifeHotspot}`}
            aria-label={
              object.id === "headphones"
                ? "打开桌边音乐控制"
                : `${object.label}：${object.description}`
            }
            onFocus={() => controller.current?.highlight(object.id)}
            onBlur={() => controller.current?.highlight(null)}
            onClick={() => props.onChoose(object.id)}
          >
            <span className={styles.dot}>
              {object.id === "notes" ? "记" : object.id === "anime" ? "映" : "♪"}
            </span>
            <span className={styles.hotspotLabel}>
              <strong>{object.label}</strong>
              <small>{object.description}</small>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
})

// A project page registers controls and callbacks; the shared renderer stays mounted.
function SharedRoomControls({ props }: { props: RoomSceneProps }) {
  const { setRoomProps, sceneStatus } = useHomeProjectState()
  const { onReady, onError } = props
  useLayoutEffect(() => {
    setRoomProps(props)
    return () => setRoomProps(null)
  }, [props, setRoomProps])
  useEffect(() => {
    if (sceneStatus === "ready") onReady()
    if (sceneStatus === "error") onError()
  }, [sceneStatus, onReady, onError])
  return null
}
export default memo(function RoomScene(props: RoomSceneProps) {
  const navigation = useHomeProjectState()
  return navigation.enabled ? <SharedRoomControls props={props} /> : <UnifiedScene {...props} />
})
