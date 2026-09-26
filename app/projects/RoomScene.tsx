"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
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
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 70)
    const controls = new OrbitControls(camera, canvas)
    controls.enablePan = false
    controls.minPolarAngle = 0.3
    controls.maxPolarAngle = Math.PI / 2 - 0.12
    controls.enableDamping = !latest.current.reduceMotion
    controls.dampingFactor = 0.12
    controls.rotateSpeed = 0.65
    controls.zoomSpeed = 0.65
    controls.target.set(0, 1.1, 0)
    const ambient = new THREE.HemisphereLight(0xf4f1e8, 0x7b7566, 2.4)
    const sun = new THREE.DirectionalLight(0xffe4bd, 3)
    sun.position.set(-3, 7, 3)
    const fill = new THREE.DirectionalLight(0xbfd7ff, 1)
    fill.position.set(3, 4, -2)
    const lamp = new THREE.PointLight(0xffcb80, 0, 5, 2)
    lamp.position.set(-1.6, 2.25, -0.8)
    scene.add(ambient, sun, fill, lamp)
    const nodeGeometry = new THREE.SphereGeometry(0.016, 8, 6)
    const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0xafd9e9, toneMapped: false })
    const signalNodes = new THREE.InstancedMesh(nodeGeometry, nodeMaterial, 7)
    const nodePoints = [
      [-0.35, -0.12],
      [-0.49, -0.02],
      [-0.2, -0.02],
      [-0.56, 0.06],
      [-0.44, 0.06],
      [-0.24, 0.06],
      [-0.12, 0.06],
    ]
    nodePoints.forEach(([x, z], index) =>
      signalNodes.setMatrixAt(index, new THREE.Matrix4().makeTranslation(x, 1.48, -z)),
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
    const media = window.matchMedia("(max-width: 767px)")
    const ray = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const projected = new THREE.Vector3()
    const worldPosition = new THREE.Vector3()
    const meshes: THREE.Mesh[] = []
    const targets = new Map<RoomTarget, THREE.Object3D>()
    const anchors = new Map<RoomTarget, THREE.Object3D>()
    const basePositions = new Map<THREE.Object3D, THREE.Vector3>()
    const buttons = new Map<RoomTarget, HTMLElement>()
    const walls: {
      object: THREE.Mesh
      material: THREE.MeshStandardMaterial
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
      for (const texture of textures) {
        const bitmap = texture.source.data
        if (typeof ImageBitmap !== "undefined" && bitmap instanceof ImageBitmap) bitmap.close()
        texture.dispose()
      }
    }

    function resetCamera() {
      // Keep the whole miniature in view in portrait, rather than cropping its sides.
      const aspect = Math.max(host!.clientWidth / Math.max(host!.clientHeight, 1), 0.5)
      const distanceScale = Math.max(0.77, Math.min(1.95, 0.98 / aspect))
      camera.position.set(-6.4, 6.5, 9.3).multiplyScalar(distanceScale)
      controls.target.set(0, 1.1, 0)
      const distance = camera.position.distanceTo(controls.target)
      controls.minDistance = Math.max(6.4, distance * 0.68)
      controls.maxDistance = distance * 1.65
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
          (!(mesh.material instanceof THREE.MeshStandardMaterial) || mesh.material.opacity > 0.5),
      )
    }

    function updateLabels() {
      const width = host!.clientWidth
      const height = host!.clientHeight
      const visibleMeshes = selectableMeshes()
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
          const hit = ray.intersectObjects(visibleMeshes, false)[0]
          visible = !hit || hit.distance > distance - 0.16 || targetFor(hit.object) === id
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
        const outside = camera.position[wall.axis] * wall.sign > (wall.axis === "x" ? 2.3 : 1.65)
        const goal = outside ? 0 : 1
        const difference = goal - wall.material.opacity
        wall.material.opacity = latest.current.reduceMotion
          ? goal
          : Math.abs(difference) < 0.015
            ? goal
            : wall.material.opacity + difference * Math.min(dt * 12, 1)
        wall.object.visible = wall.material.opacity > 0.005
        changing ||= Math.abs(goal - wall.material.opacity) > 0.005
      }
      for (const [id, object] of targets) {
        const base = basePositions.get(object)!
        const active = id === highlighted && !latest.current.paused
        const lift =
          active && ["rumor", "gudhi", "animeko"].includes(id) && !latest.current.reduceMotion
            ? 0.035
            : 0
        object.position.y = base.y + (id === "rumor" ? lift : 0)
        object.position.z = base.z + (["gudhi", "animeko"].includes(id) ? lift * 2 : 0)
        const mesh = object as THREE.Mesh
        if (mesh.material instanceof THREE.MeshStandardMaterial) {
          mesh.material.emissive.set(active ? 0x708cb1 : 0x000000)
          mesh.material.emissiveIntensity = active ? 0.15 : 0
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
      const night = latest.current.isDark
      ambient.intensity = night ? 1.25 : 2.4
      sun.intensity = night ? 0.65 : 3
      sun.color.set(night ? 0xa9bbff : 0xffe4bd)
      fill.intensity = night ? 0.45 : 1
      lamp.intensity = night ? 5 : 0.25
      renderer.toneMappingExposure = night ? 0.85 : 1
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
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
      if (!ready || wasMobile !== mobile) resetCamera()
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
      const hit = ray.intersectObjects(selectableMeshes(), false)[0]
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
    void fetch("/projects-room/study.glb", { signal: abort.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Room asset unavailable")
        return response.arrayBuffer()
      })
      .then((data) => new GLTFLoader().parseAsync(data, "/projects-room/"))
      .then((gltf) => {
        if (disposed) {
          release(gltf.scene)
          return
        }
        model = gltf.scene
        scene.add(model)
        model.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            meshes.push(object)
            // Independent feedback/opacity while all objects share the baked texture.
            object.material = (object.material as THREE.MeshStandardMaterial).clone()
            const mat = object.material as THREE.MeshStandardMaterial
            mat.side = THREE.DoubleSide
            if (object.name.startsWith("wall_")) {
              mat.transparent = true
              mat.depthWrite = false
              walls.push({
                object,
                material: mat,
                axis: object.name === "wall_left" ? "x" : "z",
                sign: -1,
              })
            }
          }
        })
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
