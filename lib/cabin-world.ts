import * as THREE from "three"
import { Reflector } from "three/addons/objects/Reflector.js"
import { HOME_POSITION, HOME_TARGET, HOME_FOV, REAR_WINDOW_Z } from "./world-camera"
import { HOME_ROOM, homeWindowProjection } from "./home-scene"
import { HOME_WINDOW_FRAGMENT } from "../components/field/homeWindowShader"
import { SPECTRAL_PLAYBACK_RATE } from "../components/field/spectralField"

// These unlabelled props are merged into the room mesh. Clear only the reading
// chair and standing lamp in front of the rear opening; keep the floor and desk.
export function clearRearWindow(model: THREE.Group) {
  model.updateMatrixWorld(true)
  const room = model.getObjectByName("room") as THREE.Mesh
  const geometry = room.geometry,
    positions = geometry.getAttribute("position"),
    index = geometry.index!
  const remove = new Uint8Array(positions.count),
    point = new THREE.Vector3()
  for (let i = 0; i < positions.count; i++) {
    point.fromBufferAttribute(positions, i).applyMatrix4(room.matrixWorld)
    if (point.y < 0 || point.y > 1.7) continue
    const chair =
      point.x >= 0.66 && point.x <= 1.2 && point.z >= 1.25 && point.z <= 1.84 && point.y <= 1.05
    const lamp = point.x >= 1.38 && point.x <= 1.74 && point.z >= 1.47 && point.z <= 1.84
    if (chair || lamp) remove[i] = 1
  }
  const keep: number[] = []
  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i),
      b = index.getX(i + 1),
      c = index.getX(i + 2)
    if (!(remove[a] && remove[b] && remove[c])) keep.push(a, b, c)
  }
  geometry.setIndex(keep)
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
}

// Draw the existing accessible controls into the architectural material. There
// is no visible DOM panel or extra coplanar mesh above the wooden surface.
function createWindowInk(reference: THREE.PerspectiveCamera, invalidate: () => void) {
  const canvas = document.createElement("canvas")
  canvas.width = 2048
  canvas.height = Math.round((canvas.width * HOME_ROOM.height) / HOME_ROOM.width)
  const context = canvas.getContext("2d")!
  const texture = new THREE.CanvasTexture(canvas)
  texture.generateMipmaps = false
  texture.minFilter = THREE.LinearFilter
  const ray = new THREE.Raycaster()
  const plane = new THREE.Plane()
  const screen = new THREE.Vector2()
  const anchors = new Map<HTMLElement, { box: DOMRect; corners: THREE.Vector3[] }>()
  let stage: HTMLElement | null = null
  let dirty = true
  let disposed = false
  let width = 0
  let height = 0
  let revision = 0
  let layout = ""
  const changed = () => {
    if (disposed) return
    dirty = true
    invalidate()
  }
  const observer = new MutationObserver(changed)
  const events = ["input", "focusin", "focusout", "pointerover", "pointerout", "load"]
  void document.fonts.ready.then(changed)

  function detach() {
    observer.disconnect()
    for (const event of events) stage?.removeEventListener(event, changed, true)
    if (stage) delete stage.dataset.homeSurface
    for (const element of anchors.keys()) {
      element.style.removeProperty("transform")
      element.style.removeProperty("pointer-events")
      element.inert = false
    }
    anchors.clear()
  }

  function draw(root: HTMLElement) {
    // Only draw the ink: the actual wood, its depth and lighting stay in the
    // architecture shader. Respect the DOM's font metrics and clipping.
    const nodes = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    while (nodes.nextNode()) {
      const node = nodes.currentNode as Text
      const parent = node.parentElement!
      if (!node.textContent?.trim() || parent.closest("svg")) continue
      const style = getComputedStyle(parent)
      const range = document.createRange()
      range.selectNodeContents(node)
      const box = range.getBoundingClientRect()
      if (!box.width || !box.height) continue
      context.save()
      for (let clip: HTMLElement | null = parent; clip; clip = clip.parentElement) {
        const css = getComputedStyle(clip)
        if (css.overflow === "hidden") {
          const rect = clip.getBoundingClientRect()
          context.beginPath()
          context.rect(rect.x, rect.y, rect.width, rect.height)
          context.clip()
        }
        if (clip === root) break
      }
      context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
      context.fillStyle = style.color
      context.textBaseline = "middle"
      context.letterSpacing = style.letterSpacing
      if (style.writingMode === "vertical-rl") {
        for (let i = 0; i < node.length; i++) {
          range.setStart(node, i)
          range.setEnd(node, i + 1)
          const char = range.getBoundingClientRect()
          context.fillText(node.data[i], char.x, char.y + char.height / 2)
        }
      } else {
        let text = node.data
        const available = parent.clientWidth
        if (style.textOverflow === "ellipsis" && context.measureText(text).width > available) {
          while (text.length && context.measureText(text + "…").width > available)
            text = text.slice(0, -1)
          text += "…"
        }
        context.fillText(text, box.x, box.y + box.height / 2)
      }
      context.restore()
    }
    for (const svg of root.querySelectorAll("svg")) {
      const box = svg.getBoundingClientRect()
      context.save()
      context.translate(box.x, box.y)
      context.scale(box.width / 24, box.height / 24)
      context.strokeStyle = getComputedStyle(svg).color
      context.lineWidth = Number(svg.getAttribute("stroke-width") ?? 2)
      context.lineCap = "round"
      context.lineJoin = "round"
      for (const shape of svg.children) {
        const n = (name: string) => Number(shape.getAttribute(name) ?? 0)
        context.beginPath()
        if (shape.tagName === "path") {
          context.stroke(new Path2D(shape.getAttribute("d") ?? ""))
          continue
        }
        if (shape.tagName === "circle") context.arc(n("cx"), n("cy"), n("r"), 0, Math.PI * 2)
        if (shape.tagName === "rect") context.rect(n("x"), n("y"), n("width"), n("height"))
        if (shape.tagName === "line") {
          context.moveTo(n("x1"), n("y1"))
          context.lineTo(n("x2"), n("y2"))
        }
        if (shape.tagName === "polyline" || shape.tagName === "polygon") {
          const points = (shape.getAttribute("points") ?? "").trim().split(/[ ,]+/).map(Number)
          for (let i = 0; i < points.length; i += 2)
            if (i === 0) context.moveTo(points[i], points[i + 1])
            else context.lineTo(points[i], points[i + 1])
          if (shape.tagName === "polygon") context.closePath()
        }
        context.stroke()
      }
      context.restore()
    }
    for (const input of root.querySelectorAll<HTMLInputElement>('input[type="range"]')) {
      const box = input.getBoundingClientRect()
      const progress =
        (Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min))
      context.save()
      context.strokeStyle = getComputedStyle(input).color
      context.fillStyle = context.strokeStyle
      context.lineWidth = 2
      context.globalAlpha = input.disabled ? 0.25 : 0.7
      context.beginPath()
      context.moveTo(box.x + 4, box.y + box.height / 2)
      context.lineTo(box.right - 4, box.y + box.height / 2)
      context.stroke()
      context.beginPath()
      context.arc(
        box.x + 4 + progress * (box.width - 8),
        box.y + box.height / 2,
        3.5,
        0,
        Math.PI * 2,
      )
      context.fill()
      context.restore()
    }
    for (const image of root.querySelectorAll("img")) {
      if (!image.complete || !image.naturalWidth) continue
      // Never taint the material canvas with an unqualified external image.
      if (image.crossOrigin !== "anonymous" && new URL(image.currentSrc).origin !== location.origin)
        continue
      const box = image.getBoundingClientRect()
      context.save()
      context.beginPath()
      context.ellipse(
        box.x + box.width / 2,
        box.y + box.height / 2,
        box.width / 2,
        box.height / 2,
        0,
        0,
        Math.PI * 2,
      )
      context.clip()
      context.drawImage(image, box.x, box.y, box.width, box.height)
      context.restore()
    }
    const focus = root.matches(":focus-visible")
      ? root
      : root.querySelector<HTMLElement>(":focus-visible")
    if (focus) {
      const box = focus.getBoundingClientRect()
      context.strokeStyle = getComputedStyle(focus).color
      context.lineWidth = 1
      context.setLineDash([3, 3])
      context.strokeRect(box.x - 2, box.y - 2, box.width + 4, box.height + 4)
      context.setLineDash([])
    }
  }

  function update(
    nextStage: HTMLElement | null,
    surface: THREE.Mesh,
    camera: THREE.PerspectiveCamera,
    unoccluded?: (point: THREE.Vector3) => boolean,
  ) {
    if (stage !== nextStage) {
      detach()
      stage = nextStage
      dirty = true
      if (stage) {
        observer.observe(stage, {
          subtree: true,
          childList: true,
          characterData: true,
          attributes: true,
          attributeFilter: [
            "aria-label",
            "aria-expanded",
            "aria-busy",
            "hidden",
            "title",
            "src",
            "value",
          ],
        })
        for (const event of events) stage.addEventListener(event, changed, true)
      }
    }
    if (!stage) return
    if (
      width !== stage.clientWidth ||
      height !== stage.clientHeight ||
      layout !== stage.style.cssText
    )
      dirty = true
    if (dirty) {
      layout = stage.style.cssText
      width = stage.clientWidth
      height = stage.clientHeight
      const view = homeWindowProjection(width, height)
      const elements = Array.from(stage.querySelectorAll<HTMLElement>("[data-home-ink]"))
      for (const element of anchors.keys()) element.style.removeProperty("transform")
      anchors.clear()
      context.setTransform(1, 0, 0, 1, 0, 0)
      context.clearRect(0, 0, canvas.width, canvas.height)
      const scale = canvas.width / view.room.width
      context.setTransform(scale, 0, 0, scale, -view.room.x * scale, -view.room.y * scale)
      surface.updateMatrixWorld(true)
      for (const element of elements) {
        const box = element.getBoundingClientRect()
        if (!box.width || !box.height) continue
        draw(element)
        screen.set(
          (2 * (box.x + box.width / 2)) / width - 1,
          1 - (2 * (box.y + box.height / 2)) / height,
        )
        ray.setFromCamera(screen, reference)
        const hit = ray.intersectObject(surface)[0]
        if (!hit?.face) continue
        plane.setFromNormalAndCoplanarPoint(
          hit.face.normal.clone().transformDirection(surface.matrixWorld),
          hit.point,
        )
        const corners = [
          [box.left, box.top],
          [box.right, box.top],
          [box.right, box.bottom],
          [box.left, box.bottom],
        ].map(([x, y]) => {
          screen.set((2 * x) / width - 1, 1 - (2 * y) / height)
          ray.setFromCamera(screen, reference)
          return ray.ray.intersectPlane(plane, new THREE.Vector3())!
        })
        anchors.set(element, { box, corners })
      }
      texture.needsUpdate = true
      stage.dataset.homeSurface = "material"
      stage.dataset.homeInkRevision = String(++revision)
      dirty = false
    }
    // Invisible native hit areas share the material's projective map. They
    // retain real links, keyboard focus and the browser's native range drag.
    for (const [element, { box, corners }] of anchors) {
      const points = corners.map((corner) => corner.clone().project(camera))
      const visible =
        points.every((point) => point.z > -1 && point.z < 1) &&
        camera.position.z < REAR_WINDOW_Z &&
        (!unoccluded || unoccluded(corners[0].clone().add(corners[2]).multiplyScalar(0.5)))
      element.inert = !visible
      element.style.pointerEvents = visible ? "" : "none"
      if (!visible) continue
      const [a, b, c, d] = points.map((point) => ({
        x: ((point.x + 1) * width) / 2,
        y: ((1 - point.y) * height) / 2,
      }))
      const dx1 = b.x - c.x,
        dx2 = d.x - c.x,
        dx3 = a.x - b.x + c.x - d.x
      const dy1 = b.y - c.y,
        dy2 = d.y - c.y,
        dy3 = a.y - b.y + c.y - d.y
      const denominator = dx1 * dy2 - dx2 * dy1
      const g = Math.abs(denominator) < 1e-8 ? 0 : (dx3 * dy2 - dx2 * dy3) / denominator
      const h = Math.abs(denominator) < 1e-8 ? 0 : (dx1 * dy3 - dx3 * dy1) / denominator
      element.style.transform = `matrix3d(${(b.x - a.x + g * (b.x - box.x)) / box.width},${(b.y - a.y + g * (b.y - box.y)) / box.width},0,${g / box.width},${(d.x - a.x + h * (d.x - box.x)) / box.height},${(d.y - a.y + h * (d.y - box.y)) / box.height},0,${h / box.height},0,0,1,0,${a.x - box.x},${a.y - box.y},0,1)`
    }
  }
  return {
    texture,
    update,
    refresh: changed,
    dispose: () => {
      disposed = true
      detach()
    },
  }
}

export async function buildCabinWorld(
  scene: THREE.Scene,
  model: THREE.Group,
  invalidate = () => {},
) {
  const world = new THREE.Group()
  world.name = "home-interior-world"
  scene.add(world)
  const outside = new THREE.Group()
  outside.name = "lake-environment"
  outside.rotation.y = Math.PI
  world.add(outside)
  const interior = new THREE.Group()
  interior.name = "rear-floor-window"
  world.add(interior)
  const homeUniforms = {
    uLake: { value: null as THREE.Texture | null },
    uRoom: { value: null as THREE.Texture | null },
    uSky: { value: null as THREE.Texture | null },
    uClouds: { value: null as THREE.Texture | null },
    uBranch: { value: null as THREE.Texture | null },
    uSkyRegion: { value: null as THREE.Texture | null },
    uRoomLight: { value: null as THREE.Texture | null },
    uPanorama: { value: null as THREE.Texture | null },
    uPanoramaProjection: {
      value: new THREE.Matrix3().set(
        0.3985677015,
        -0.0182282825,
        0.2939334549,
        -0.0086034341,
        0.6090405779,
        0.2288247034,
        -0.0193967742,
        -0.0440799696,
        1,
      ),
    },
    uSize: { value: new THREE.Vector2() },
    uRoomRect: { value: new THREE.Vector4() },
    uLakeRect: { value: new THREE.Vector4() },
    uLook: { value: new THREE.Vector2() },
    uStrength: { value: 2.8 },
    uTime: { value: 0 },
    uWorldTime: { value: 0 },
    uAmbientBlend: { value: 0 },
    uInteriorOpacity: { value: 1 },
    uReveal: { value: 0 },
    uWindowCrop: { value: 0 },
    uEffects: { value: new THREE.Vector4(1, 0, 1, 1) },
  }
  // The homepage is built from world geometry from the first frame. The photo
  // supplies materials, never a screen-space layer swapped out on departure.
  const reference = new THREE.PerspectiveCamera(HOME_FOV, 1, 0.05, 700)
  reference.position.copy(HOME_POSITION)
  reference.lookAt(HOME_TARGET)
  reference.updateMatrixWorld(true)
  const ink = typeof document === "undefined" ? null : createWindowInk(reference, invalidate)
  // Geometry-only callers do not need a browser canvas.
  const inkTexture = ink?.texture ?? new THREE.DataTexture(new Uint8Array(4), 1, 1)
  inkTexture.needsUpdate = true
  const projection = new THREE.Matrix4()
  const vertexShader = `precision highp float;
    uniform mat4 modelMatrix, viewMatrix, projectionMatrix, homeProjection;
    in vec3 position; out vec2 homeUv;
    void main(){
      vec4 world=modelMatrix*vec4(position,1.);
      vec4 photo=homeProjection*world;
      homeUv=photo.xy/photo.w*.5+.5;
      gl_Position=projectionMatrix*viewMatrix*world;
    }`
  // Preserve projective interpolation, including when a triangle spans depth.
  const projectedVertex = vertexShader
    .replace("out vec2 homeUv;", "out vec4 homePhoto;")
    .replace("homeUv=photo.xy/photo.w*.5+.5;", "homePhoto=photo;")
  const projectedFragment = HOME_WINDOW_FRAGMENT.replace(
    "in vec2 homeUv;",
    "in vec4 homePhoto;\n#define homeUv (homePhoto.xy/homePhoto.w*.5+.5)\n",
  )
  const roomMaterial = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: {
      ...homeUniforms,
      homeProjection: { value: projection },
      uWindowInk: { value: inkTexture },
    },
    vertexShader: projectedVertex,
    fragmentShader: projectedFragment
      .replace(
        "uniform sampler2D uRoom;",
        "uniform sampler2D uRoom;\nuniform sampler2D uWindowInk;",
      )
      .replace(
        "  interior.a*=uInteriorOpacity;",
        `
        float photoCoverage=rise(-.02,0.,r.x)*(1.-rise(1.,1.02,r.x))
          *rise(-.02,0.,r.y)*(1.-rise(.94,.98,r.y));
        interior=mix(vec4(.77,.78,.76,1.),interior,photoCoverage);
        vec4 ink=texture(uWindowInk,vec2(r.x,1.-r.y));
        interior.rgb=mix(interior.rgb,interior.rgb*ink.rgb,ink.a*.9);`,
      )
      .replace(
        "if(interior.a>.99999){ colour=vec4(interior.rgb,wallAlpha); return; }",
        "if(interior.a<.5) discard; colour=vec4(interior.rgb,1.); return;",
      ),
    toneMapped: false,
    side: THREE.FrontSide,
  })
  const roomSurface = new THREE.Mesh(new THREE.BufferGeometry(), roomMaterial)
  roomSurface.name = "home-window-architecture"
  interior.add(roomSurface)
  const exteriorUniforms = {
    ...homeUniforms,
    homeProjection: { value: projection },
    uInteriorOpacity: { value: 0 },
  }
  const exteriorFragment =
    projectedFragment.slice(0, projectedFragment.indexOf("void main(){")) +
    `
    uniform sampler2D uPanorama;
    uniform mat3 uPanoramaProjection;
    void main(){
      vec2 pixel=vec2(homeUv.x,1.-homeUv.y)*uSize;
      vec2 p=(pixel-uLakeRect.xy)/uLakeRect.zw;
      vec3 registered=uPanoramaProjection*vec3(p,1.);
      vec2 panoramaUv=registered.xy/registered.z;
      // One fixed panorama from the first frame, rather than a rectangular
      // original image that changes into its extension as scrolling starts.
      vec3 exterior=texture(uPanorama,vec2(panoramaUv.x,1.-panoramaUv.y)).rgb;
      float coverage=skyCoverage(p)*uAmbientBlend
        *rise(0.,.12,p.x)*(1.-rise(.88,1.,p.x))
        *rise(0.,.08,p.y)*(1.-rise(.85,1.,p.y));
      if(coverage>0.) {
        vec4 cloud=cloudAt(p,uWorldTime*uEffects.x);
        exterior=mix(exterior,cloud.rgb,cloud.a*coverage);
      }
      colour=vec4(exterior,1.);
    }`
  const exteriorMaterial = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: exteriorUniforms,
    vertexShader: projectedVertex,
    fragmentShader: exteriorFragment,
    side: THREE.DoubleSide,
    toneMapped: false,
  })
  // Reflect the actual scene about y=0. No photographed reflection, mirrored
  // texture tile or screen-space water layer is stretched across the lake.
  const lake = new Reflector(new THREE.BufferGeometry(), {
    textureWidth: 512,
    textureHeight: 512,
    multisample: 0,
    clipBias: 0.0003,
    shader: {
      name: "LakeWater",
      uniforms: {
        color: { value: null },
        tDiffuse: { value: null },
        textureMatrix: { value: null },
        seconds: { value: 0 },
      },
      vertexShader: `
        uniform mat4 textureMatrix;
        varying vec4 reflectionUv;
        varying vec3 waterPoint;
        void main() {
          waterPoint=(modelMatrix*vec4(position,1.)).xyz;
          reflectionUv=textureMatrix*vec4(position,1.);
          gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
        }`,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float seconds;
        varying vec4 reflectionUv;
        varying vec3 waterPoint;
        // Small deep-water gravity waves: omega^2=g*k, metres and seconds.
        vec2 slope(vec2 d,float wavelength,float amplitude) {
          float k=6.2831853/wavelength;
          return d*(amplitude*k*cos(k*dot(d,waterPoint.xz)-sqrt(9.81*k)*seconds));
        }
        void main() {
          if(waterPoint.z<2.6) discard;
          vec2 gradient=slope(vec2(.8,.6),1.8,.006)
            +slope(vec2(-.6,.8),.72,.002)
            +slope(vec2(.28,-.96),.31,.0007);
          vec3 normal=normalize(vec3(-gradient.x,1.,-gradient.y));
          vec3 view=normalize(cameraPosition-waterPoint);
          float incidence=clamp(dot(normal,view),0.,1.);
          // Air/water n=1.333; Schlick's approximation to Fresnel reflectance.
          float fresnel=.02037+.97963*pow(1.-incidence,5.);
          vec2 uv=reflectionUv.xy/reflectionUv.w;
          float distanceToEye=length(cameraPosition-waterPoint);
          uv+=gradient*.018/(1.+distanceToEye*.035);
          vec3 reflected=texture2D(tDiffuse,clamp(uv,vec2(.001),vec2(.999))).rgb;
          // The photo materials output sRGB into the reflection target too.
          // Mix energy in linear light, then encode once for the main output.
          reflected=pow(max(reflected,vec3(0.)),vec3(2.2));
          vec3 transmitted=vec3(.018,.095,.135);
          vec3 water=mix(transmitted,reflected,fresnel);
          gl_FragColor=vec4(pow(max(water,vec3(0.)),vec3(1./2.2)),1.);
        }`,
    },
  })
  lake.rotation.x = -Math.PI / 2
  const waterMaterial = lake.material as THREE.ShaderMaterial
  waterMaterial.toneMapped = false
  const mountains = new THREE.Mesh(new THREE.BufferGeometry(), exteriorMaterial)
  mountains.name = "distant-mountains"
  lake.name = "lake-water"
  outside.rotation.y = 0
  outside.add(mountains, lake)
  const bankX = [0, 103, 252, 459, 802, 1118, 1414, 1672]
  const bankY = [579, 558, 552, 549, 548, 545, 546, 544]
  const bank = (x: number) => {
    const p = THREE.MathUtils.clamp(x * 1672, 0, 1672)
    for (let i = 0; i < bankX.length - 1; i++)
      if (p <= bankX[i + 1])
        return (
          THREE.MathUtils.lerp(bankY[i], bankY[i + 1], (p - bankX[i]) / (bankX[i + 1] - bankX[i])) /
          877
        )
    return bankY[7] / 877
  }
  let width = 1,
    height = 1,
    homeProjection = homeWindowProjection(1, 1)
  const resize = (w: number, h: number) => {
    width = w
    height = h
    homeProjection = homeWindowProjection(w, h)
    const r = homeProjection.room,
      l = homeProjection.lake
    homeUniforms.uSize.value.set(w, h)
    homeUniforms.uRoomRect.value.set(r.x, r.y, r.width, r.height)
    homeUniforms.uLakeRect.value.set(l.x, l.y, l.width, l.height)
    reference.aspect = w / h
    reference.updateProjectionMatrix()
    projection.multiplyMatrices(reference.projectionMatrix, reference.matrixWorldInverse)
    const photoPoint = (x: number, y: number, z: number) => {
      const direction = new THREE.Vector3(
        (2 * (r.x + (x / HOME_ROOM.width) * r.width)) / w - 1,
        1 - (2 * (r.y + (y / HOME_ROOM.height) * r.height)) / h,
        0.5,
      )
        .unproject(reference)
        .sub(reference.position)
      return reference.position
        .clone()
        .addScaledVector(direction, (z - HOME_POSITION.z) / direction.z)
    }
    // Four connected wall/frame strips with a real aperture and 18cm reveal.
    // Perspective-calibrated photo materials keep the original wood grain.
    const outer = [
      new THREE.Vector3(2.22, 3.15, REAR_WINDOW_Z),
      new THREE.Vector3(-2.22, 3.15, REAR_WINDOW_Z),
      new THREE.Vector3(-2.22, 0, REAR_WINDOW_Z),
      new THREE.Vector3(2.22, 0, REAR_WINDOW_Z),
    ]
    const frame = [
      photoPoint(95, 43, REAR_WINDOW_Z),
      photoPoint(1492, 43, REAR_WINDOW_Z),
      photoPoint(1492, 796, REAR_WINDOW_Z - 0.12),
      photoPoint(95, 796, REAR_WINDOW_Z - 0.12),
    ]
    const opening = [
      photoPoint(197, 126, REAR_WINDOW_Z + 0.18),
      photoPoint(1390, 126, REAR_WINDOW_Z + 0.18),
      photoPoint(1390, 737, REAR_WINDOW_Z + 0.18),
      photoPoint(197, 737, REAR_WINDOW_Z + 0.18),
    ]
    const architecture: number[] = [],
      architectureIndices: number[] = []
    for (const [a, b] of [
      [outer, frame],
      [frame, opening],
    ]) {
      for (let i = 0; i < 4; i++) {
        const next = (i + 1) % 4,
          offset = architecture.length / 3
        for (const point of [a[i], a[next], b[next], b[i]]) architecture.push(...point.toArray())
        architectureIndices.push(offset, offset + 2, offset + 1, offset, offset + 3, offset + 2)
      }
    }
    roomSurface.geometry.dispose()
    roomSurface.geometry = new THREE.BufferGeometry()
    roomSurface.geometry.setAttribute("position", new THREE.Float32BufferAttribute(architecture, 3))
    roomSurface.geometry.setIndex(architectureIndices)
    roomSurface.geometry.computeBoundingSphere()
    // Reflection resolution is bounded and follows the viewport, not DPR.
    const reflectionScale = Math.min(1, 1024 / Math.max(w, h))
    lake
      .getRenderTarget()
      .setSize(
        Math.max(1, Math.round(w * reflectionScale)),
        Math.max(1, Math.round(h * reflectionScale)),
      )
    for (const [mesh, water] of [
      [mountains, false],
      [lake, true],
    ] as const) {
      const positions: number[] = [],
        indices: number[] = []
      const columns = 80,
        rows = water ? 24 : 32
      for (let y = 0; y <= rows; y++) {
        for (let x = 0; x <= columns; x++) {
          const px = -1 + (3 * x) / columns
          const edge = bank(px)
          const py = water
            ? THREE.MathUtils.lerp(edge, 3, y / rows)
            : THREE.MathUtils.lerp(-2, edge, y / rows)
          const screen = new THREE.Vector3(
            (2 * (l.x + px * l.width)) / w - 1,
            1 - (2 * (l.y + py * l.height)) / h,
            0.5,
          )
            .unproject(reference)
            .sub(reference.position)
            .normalize()
          // Keep terrain above the lake. At the photographed waterline these
          // two surfaces share exactly the same vertices, with no overlapping
          // water photograph underneath the mountains.
          const groundDistance = screen.y < 0 ? -HOME_POSITION.y / screen.y : Infinity
          const distance = water ? groundDistance : Math.min(180 / screen.z, groundDistance)
          const point = reference.position.clone().addScaledVector(screen, distance)
          if (water) positions.push(point.x, -point.z, 0)
          else positions.push(point.x, point.y, point.z)
          if (x < columns && y < rows) {
            const i = y * (columns + 1) + x
            if (water)
              indices.push(i, i + columns + 1, i + 1, i + 1, i + columns + 1, i + columns + 2)
            else indices.push(i, i + 1, i + columns + 1, i + 1, i + columns + 2, i + columns + 1)
          }
        }
      }
      mesh.geometry.dispose()
      mesh.geometry = new THREE.BufferGeometry()
      mesh.geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
      mesh.geometry.setIndex(indices)
      mesh.geometry.computeBoundingSphere()
    }
    ink?.refresh()
  }
  const loaded = new Set<THREE.Texture>([inkTexture])
  let failed = false
  const names = [
    "uLake",
    "uRoom",
    "uSky",
    "uClouds",
    "uBranch",
    "uSkyRegion",
    "uRoomLight",
    "uPanorama",
  ] as const
  const files = [
    "convict-lake-day-study.webp",
    "observation-room-open.webp",
    "ambient-sky.webp",
    "ambient-clouds.webp",
    "ambient-branch.webp",
    "ambient-sky-region.png",
    "ambient-room-light.png",
    "lake-periphery-v1.webp",
  ]
  try {
    await Promise.all(
      files.map(async (file, i) => {
        const texture = await new THREE.TextureLoader().loadAsync("/home-window/" + file)
        if (failed) {
          texture.dispose()
          return
        }
        texture.colorSpace = THREE.NoColorSpace
        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter
        texture.generateMipmaps = false
        loaded.add(texture)
        homeUniforms[names[i]].value = texture
      }),
    )
  } catch (error) {
    ink?.dispose()
    failed = true
    world.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object instanceof Reflector) object.getRenderTarget().dispose()
        object.geometry.dispose()
        for (const material of Array.isArray(object.material) ? object.material : [object.material])
          material.dispose()
      }
    })
    for (const texture of loaded) texture.dispose()
    scene.remove(world)
    throw error
  }
  const update = (
    progress: number,
    seconds: number,
    pointer: THREE.Vector2,
    publish = true,
    camera?: THREE.PerspectiveCamera,
    unoccluded?: (point: THREE.Vector3) => boolean,
  ) => {
    homeUniforms.uTime.value = seconds * SPECTRAL_PLAYBACK_RATE
    homeUniforms.uWorldTime.value = seconds
    homeUniforms.uAmbientBlend.value = Math.min(1, seconds / 1.2)
    waterMaterial.uniforms.seconds.value = seconds
    // The photographed interior is a one-sided wall assembly, like the shipped
    // room's wall cutaways. Cull its whole rear, including bevels, when the eye
    // is outside. While crossing the aperture the frame is out of view already;
    // it never fades or swaps materials while viewed from inside the room.
    interior.visible = !camera || camera.position.z <= REAR_WINDOW_Z
    model.visible = true
    const stage =
      publish && typeof document !== "undefined"
        ? document.querySelector<HTMLElement>("[data-home-scene]")
        : null
    if (publish && camera) ink?.update(stage, roomSurface, camera, unoccluded)
    if (stage) {
      stage.dataset.homeRendering = "dynamic"
      stage.dataset.homeAmbientBlend = homeUniforms.uAmbientBlend.value.toFixed(3)
      stage.dataset.homeFieldTime = homeUniforms.uTime.value.toFixed(4)
      stage.dataset.homeWorldTime = seconds.toFixed(3)
      stage.dataset.homeReflectionStatus = "planar-scene"
      stage.dataset.homeLook = pointer
        .toArray()
        .map((n) => n.toFixed(3))
        .join(",")
    }
    return { width, height }
  }
  return { time: homeUniforms.uTime, resize, update, dispose: () => ink?.dispose() }
}
