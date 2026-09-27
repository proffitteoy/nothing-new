"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { Octree } from "three/addons/math/Octree.js"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { lifeObjects, projects, roomTargets, type RoomTarget } from "./projects"
import styles from "./room.module.css"

type Props = {
  isDark: boolean
  reduceMotion: boolean
  rotationEnabled: boolean
  paused: boolean
  showLabels: boolean
  resetKey: number
  onReady: () => void
  onError: () => void
  onChoose: (target: RoomTarget) => void
}

// This component owns all GPU resources. React owns the accessible text layer.
export default function RoomScene(props: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const latest = useRef(props)
  const controller = useRef<{
    update: () => void
    highlight: (id: RoomTarget | null) => void
  } | null>(null)

  useEffect(() => {
    latest.current = props
    controller.current?.update()
  }, [props])

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
      })
    } catch {
      latest.current.onError()
      return
    }
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(47, 1, 0.05, 35)
    const controls = new OrbitControls(camera, canvas)
    controls.enablePan = false
    controls.minPolarAngle = 0.45
    controls.maxPolarAngle = Math.PI / 2 - 0.18
    controls.enableDamping = !latest.current.reduceMotion
    controls.dampingFactor = 0.12
    controls.rotateSpeed = 0.65
    controls.zoomSpeed = 0.65
    controls.target.set(0, 1.1, 0)
    // Day/night diffuse lighting is baked in Cycles: shadow detail without per-frame lights.
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

    let model: THREE.Group | null = null
    let disposed = false
    let ready = false
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
    const hitTrees = new Map<THREE.Mesh, Octree>()
    const localRay = new THREE.Ray()
    const localHit = new THREE.Vector3()
    const inverse = new THREE.Matrix4()
    const bakedTextures = new Set<THREE.Texture>()
    let dayTexture: THREE.Texture | null = null
    let nightTexture: THREE.Texture | null = null
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
      const materials = new Set<THREE.Material>()
      const textures = new Set<THREE.Texture>()
      root.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return
        object.geometry.dispose()
        for (const mat of Array.isArray(object.material) ? object.material : [object.material]) {
          materials.add(mat)
          for (const value of Object.values(mat))
            if (value instanceof THREE.Texture) textures.add(value)
        }
      })
      for (const mat of materials) mat.dispose()
      for (const texture of bakedTextures) textures.add(texture)
      for (const texture of textures) {
        const bitmap = texture.source.data
        if (typeof ImageBitmap !== "undefined" && bitmap instanceof ImageBitmap) bitmap.close()
        texture.dispose()
      }
    }

    function resetCamera() {
      const portrait = host!.clientWidth / Math.max(host!.clientHeight, 1) < 1
      // Human-scale view: eyes above the desktop, looking slightly down into the room.
      camera.position.set(portrait ? -0.75 : -0.62, portrait ? 2.3 : 1.9, portrait ? 4.8 : 2.72)
      controls.target.set(0.08, 1.06, -0.5)
      controls.minDistance = portrait ? 3.1 : 2.4
      controls.maxDistance = portrait ? 7 : 5.8
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
      return meshes.filter(
        (mesh) =>
          mesh.visible &&
          (!(mesh.material instanceof THREE.MeshBasicMaterial) || mesh.material.opacity > 0.5),
      )
    }

    // Static local octrees accelerate both label occlusion and pointer selection.
    // Transform each ray into the mesh's baked local space, so hover lifts stay correct.
    function closestHit() {
      let closest: { distance: number; object: THREE.Mesh } | null = null
      for (const mesh of selectableMeshes()) {
        inverse.copy(mesh.matrixWorld).invert()
        localRay.copy(ray.ray).applyMatrix4(inverse)
        const bound = occluders.get(mesh)
        if (!bound || !localRay.intersectBox(bound, localHit)) continue
        const hit = hitTrees.get(mesh)?.rayIntersect(localRay)
        if (!hit) continue
        localHit.copy(hit.position)
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
      if (mobile && now - lastFrame < 30) {
        schedule()
        return
      }
      const dt = Math.min((now - lastFrame) / 1000, 0.05)
      lastFrame = now
      const moved = controls.update()
      let changing = false
      for (const wall of walls) {
        const outside = camera.position[wall.axis] * wall.sign > (wall.axis === "x" ? 1.95 : 1.5)
        const goal = outside ? 0 : 1
        const difference = goal - wall.material.opacity
        wall.material.opacity = latest.current.reduceMotion
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
          active && ["rumor", "gudhi", "animeko"].includes(id) && !latest.current.reduceMotion
            ? 0.008
            : 0
        object.position.y = base.y + (id === "rumor" ? lift : 0)
        object.position.z = base.z + (["gudhi", "animeko"].includes(id) ? lift * 2 : 0)
        const mesh = object as THREE.Mesh
        if (mesh.material instanceof THREE.MeshBasicMaterial) {
          mesh.material.color.set(active ? 0xc7dcff : 0xffffff)
        }
      }
      signalNodes.visible = highlighted === "rumor" && !latest.current.paused
      if (signalNodes.visible) {
        signalNodes.count = latest.current.reduceMotion
          ? 7
          : Math.min(7, 1 + Math.floor((now - signalStarted) / 100))
        changing ||= signalNodes.count < 7
      }
      if (model) {
        model.updateMatrixWorld(true)
        renderer.render(scene, camera)
        updateLabels()
        // Standard DOM diagnostics; no global debug API or persistent counters.
        canvas!.dataset.triangles = String(renderer.info.render.triangles)
        canvas!.dataset.drawCalls = String(renderer.info.render.calls)
      }
      if (moved || changing || now < animateUntil) schedule()
    }

    function update() {
      if (disposed) return
      mobile = media.matches
      const interactive = !latest.current.paused && (!mobile || latest.current.rotationEnabled)
      controls.enabled = interactive
      controls.enableDamping = !latest.current.reduceMotion
      canvas!.style.touchAction = mobile && !latest.current.rotationEnabled ? "pan-y" : "none"
      const texture = latest.current.isDark ? nightTexture : dayTexture
      if (texture) {
        for (const mesh of meshes) {
          const material = mesh.material as THREE.MeshBasicMaterial
          material.map = texture
        }
      }
      if (resetKey !== latest.current.resetKey) {
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
      if (!ready || wasMobile !== mobile || orientationChanged) resetCamera()
      update()
    }

    function hitAt(event: PointerEvent) {
      if (!model) return null
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
      animateUntil = latest.current.reduceMotion ? 0 : performance.now() + 700
      schedule()
    }
    function cancel() {
      pointerDown = null
      dragged = true
      highlight(null)
    }
    function leave() {
      highlight(null)
    }
    function visibility() {
      if (document.visibilityState === "hidden") {
        cancelAnimationFrame(frame)
        frame = 0
      } else schedule()
    }
    function lost(event: Event) {
      event.preventDefault()
      latest.current.onError()
    }
    function change() {
      schedule()
    }
    controller.current = { update, highlight }
    controls.addEventListener("change", change)
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

    const abort = new AbortController()
    const timeout = window.setTimeout(() => abort.abort(), 20000)
    void Promise.all([
      fetch("/projects-room/study.glb", { signal: abort.signal }).then(async (response) => {
        if (!response.ok) throw new Error("Room asset unavailable")
        return response.arrayBuffer()
      }),
      fetch("/projects-room/study-night.jpg", { signal: abort.signal }).then(async (response) => {
        if (!response.ok) throw new Error("Night lighting unavailable")
        return response.blob()
      }),
    ])
      .then(async ([data, night]) => {
        if (disposed) return null
        const bitmap = await createImageBitmap(night, { colorSpaceConversion: "none" })
        if (disposed) {
          bitmap.close()
          return null
        }
        nightTexture = new THREE.Texture(bitmap)
        nightTexture.flipY = false
        nightTexture.colorSpace = THREE.SRGBColorSpace
        nightTexture.needsUpdate = true
        bakedTextures.add(nightTexture)
        return new GLTFLoader().parseAsync(data, "/projects-room/")
      })
      .then((gltf) => {
        if (!gltf) return
        if (disposed) {
          release(gltf.scene)
          return
        }
        model = gltf.scene
        scene.add(model)
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
            dayTexture = mat.map
            if (dayTexture) bakedTextures.add(dayTexture)
            object.geometry.computeBoundingBox()
            occluders.set(object, object.geometry.boundingBox!.clone())
            const localMesh = new THREE.Mesh(object.geometry, mat)
            const tree = new Octree().fromGraphNode(localMesh)
            hitTrees.set(object, tree)
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
        for (const material of sourceMaterials) material.dispose()
        for (const id of roomTargets) {
          const object = model.getObjectByName(id)
          const anchor = model.getObjectByName(`anchor_${id}`)
          if (!object || !anchor) throw new Error(`Missing room object: ${id}`)
          targets.set(id, object)
          basePositions.set(object, object.position.clone())
          anchors.set(id, anchor)
        }
        ready = true
        update()
        latest.current.onReady()
      })
      .catch((error: unknown) => {
        if (!disposed) {
          console.error("Study scene could not load", error)
          latest.current.onError()
        }
      })
      .finally(() => window.clearTimeout(timeout))

    return () => {
      disposed = true
      abort.abort()
      window.clearTimeout(timeout)
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
      if (model) release(model)
      else
        for (const texture of bakedTextures) {
          ;(texture.source.data as ImageBitmap).close()
          texture.dispose()
        }
      for (const tree of hitTrees.values()) tree.clear()
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
    <div ref={hostRef} className={styles.scene} data-labels={props.showLabels} inert={props.paused}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
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
}
