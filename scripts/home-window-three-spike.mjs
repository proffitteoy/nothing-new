// Browser-only comparison harness, bundled by the acceptance script. Never
// imported by the site. Independently implemented fixed-projector mapping;
// no unlicensed reference shaders or code are copied.
import * as THREE from "three"
import { HOME_MOUNTAIN_PROFILE, homeLandscapeRect } from "../components/field/homeSpectralScene"

window.startNightWindowComparison = async () => {
  const opening = document.querySelector("[data-home-viewport]")
  const source = opening.querySelector("[data-home-artwork] img")
  await source.decode()
  const width = opening.clientWidth,
    height = opening.clientHeight
  const rect = homeLandscapeRect(width, height)
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false })
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5))
  renderer.setSize(width, height)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  Object.assign(renderer.domElement.style, {
    position: "absolute",
    inset: "0",
    zIndex: "2",
    pointerEvents: "none",
  })
  renderer.domElement.dataset.homeThreeSpike = ""
  opening.insertBefore(renderer.domElement, opening.querySelector("[data-home-canvas]"))
  const hidden = [...opening.children].filter(
    (e) =>
      e.querySelector("[data-home-plane]") ||
      (e !== renderer.domElement && e.querySelector("img") && !e.hasAttribute("data-home-artwork")),
  )
  hidden.forEach((e) => (e.style.visibility = "hidden"))
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100)
  camera.position.z = 10
  camera.updateMatrixWorld()
  const projector = new THREE.Matrix4().multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse,
  )
  const worldHeight = 2 * 10 * Math.tan(THREE.MathUtils.degToRad(35) / 2)
  const worldWidth = (worldHeight * width) / height
  const textures = [],
    geometries = [],
    materials = []
  for (const [name, z] of [
    ["sky", -15],
    ["mountains", 0],
    ["shore", 3.75],
  ]) {
    const bitmap = document.createElement("canvas")
    bitmap.width = 1536
    bitmap.height = 868
    const ctx = bitmap.getContext("2d")
    if (name === "sky") ctx.filter = "blur(9px)"
    ctx.drawImage(source, 0, 0, bitmap.width, bitmap.height)
    ctx.filter = "none"
    if (name !== "sky") {
      ctx.globalCompositeOperation = "destination-in"
      ctx.beginPath()
      if (name === "mountains") {
        for (const [i, [x, y]] of HOME_MOUNTAIN_PROFILE.entries()) {
          if (i === 0) ctx.moveTo(x * 1536, y * 868)
          else ctx.lineTo(x * 1536, y * 868)
        }
        ctx.lineTo(1536, 868)
        ctx.lineTo(0, 868)
      } else {
        for (const [i, [x, y]] of [
          [0, 0.75],
          [0.02, 0.76],
          [0.04, 0.81],
          [0.055, 0.91],
          [0.03, 1],
          [0, 1],
        ].entries()) {
          if (i === 0) ctx.moveTo(x * 1536, y * 868)
          else ctx.lineTo(x * 1536, y * 868)
        }
      }
      ctx.closePath()
      ctx.fill()
    }
    const texture = new THREE.CanvasTexture(bitmap)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.generateMipmaps = false
    texture.minFilter = texture.magFilter = THREE.LinearFilter
    textures.push(texture)
    const geometry = new THREE.PlaneGeometry(
      ((worldWidth * (10 - z)) / 10) * 1.15,
      ((worldHeight * (10 - z)) / 10) * 1.15,
    )
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uImage: { value: texture },
        uProjector: { value: projector },
        uFrame: {
          value: new THREE.Vector4(
            rect.x / width,
            1 - (rect.y + rect.height) / height,
            rect.width / width,
            rect.height / height,
          ),
        },
      },
      vertexShader: `uniform mat4 uProjector; varying vec4 vReference;
        void main() { vec4 world = modelMatrix * vec4(position, 1.0);
          vReference = uProjector * world;
          gl_Position = projectionMatrix * viewMatrix * world; }`,
      fragmentShader: `uniform sampler2D uImage; uniform vec4 uFrame; varying vec4 vReference;
        void main() { vec2 reference = vReference.xy / vReference.w * .5 + .5;
          vec2 uv = (reference - uFrame.xy) / uFrame.zw;
          if (min(uv.x,uv.y) < 0.0 || max(uv.x,uv.y) > 1.0) discard;
          gl_FragColor = texture2D(uImage, uv);
          #include <colorspace_fragment>
        }`,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.z = z
    mesh.renderOrder = materials.length
    scene.add(mesh)
    geometries.push(geometry)
    materials.push(material)
  }
  const stats = {
    frames: 0,
    totalMs: 0,
    maxMs: 0,
    textureBytes: 3 * 1536 * 868 * 4,
    drawingBufferBytes: renderer.domElement.width * renderer.domElement.height * 4,
    renderTargetBytes: 0,
    vendor: renderer.getContext().getParameter(renderer.getContext().VERSION),
  }
  const draw = () => {
    const began = performance.now()
    camera.position.x =
      (-parseFloat(opening.style.getPropertyValue("--look-x") || "0") * 10 * worldWidth) / width
    camera.position.y =
      (parseFloat(opening.style.getPropertyValue("--look-y") || "0") * 6 * worldHeight) / height
    camera.updateMatrixWorld()
    renderer.render(scene, camera)
    const cost = performance.now() - began
    stats.frames++
    stats.totalMs += cost
    stats.maxMs = Math.max(stats.maxMs, cost)
  }
  // The application's existing frame updates the pointer variables. Observe
  // that update rather than introducing a second animation clock/RAF.
  const observer = new MutationObserver(draw)
  observer.observe(opening, { attributes: true, attributeFilter: ["style"] })
  draw()
  window.__nightWindowComparison = {
    stats,
    destroy() {
      observer.disconnect()
      hidden.forEach((e) => (e.style.visibility = ""))
      textures.forEach((t) => {
        t.image.width = t.image.height = 0
        t.dispose()
      })
      geometries.forEach((g) => g.dispose())
      materials.forEach((m) => m.dispose())
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    },
  }
  return stats
}
