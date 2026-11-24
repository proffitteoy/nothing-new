import * as THREE from "three"
import { HOME_POSITION, HOME_TARGET, HOME_FOV, REAR_WINDOW_Z } from "./world-camera"
import { homeWindowLook, homeWindowProjection } from "./home-scene"
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

export async function buildCabinWorld(scene: THREE.Scene, model: THREE.Group) {
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
  const frame = new THREE.MeshBasicMaterial({
    color: 0x9c866e,
    toneMapped: false,
    transparent: true,
    depthWrite: false,
  })
  const box = (
    name: string,
    size: number[],
    position: number[],
    material: THREE.Material,
    parent = outside,
  ) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material)
    mesh.name = name
    mesh.position.set(position[0], position[1], position[2])
    parent.add(mesh)
    return mesh
  }
  // The rear glazing meets the shipped floor directly. No added room or hall.
  for (const x of [-2.22, 2.22])
    box("rear-window-jamb", [0.045, 3.15, 0.006], [x, 1.575, REAR_WINDOW_Z], frame, interior)
  for (const y of [0.0225, 3.1275])
    box("rear-window-rail", [4.44, 0.045, 0.006], [0, y, REAR_WINDOW_Z], frame, interior)
  const homeUniforms = {
    uLake: { value: null as THREE.Texture | null },
    uRoom: { value: null as THREE.Texture | null },
    uSky: { value: null as THREE.Texture | null },
    uClouds: { value: null as THREE.Texture | null },
    uBranch: { value: null as THREE.Texture | null },
    uSkyRegion: { value: null as THREE.Texture | null },
    uRoomLight: { value: null as THREE.Texture | null },
    uPanorama: { value: null as THREE.Texture | null },
    uPanoramaBlend: { value: 0 },
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
    uOpacity: { value: 1 },
    uReveal: { value: 0 },
    uWindowCrop: { value: 0 },
    uEffects: { value: new THREE.Vector4(1, 0, 1, 1) },
  }
  const surface = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: homeUniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      vertexShader: `precision highp float;
      in vec3 position; in vec2 uv; out vec2 homeUv;
      void main(){homeUv=uv;gl_Position=vec4(uv*2.-1.,0.,1.);}`,
      fragmentShader:
        HOME_WINDOW_FRAGMENT.replace("void main(){", "void shadeHome(){") +
        "\nuniform float uOpacity; void main(){shadeHome();colour.a*=uOpacity;}",
    }),
  )
  surface.name = "home-compositor"
  surface.renderOrder = 100
  surface.frustumCulled = false
  world.add(surface)
  // The resting homepage is pixel-identical to the old shader. On departure,
  // separate its opaque architecture from its landscape without crossfading
  // two views. Both world materials use this same calibrated photo projection.
  const reference = new THREE.PerspectiveCamera(HOME_FOV, 1, 0.05, 700)
  reference.position.copy(HOME_POSITION)
  reference.lookAt(HOME_TARGET)
  reference.updateMatrixWorld(true)
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
    uniforms: { ...homeUniforms, homeProjection: { value: projection } },
    vertexShader: projectedVertex,
    fragmentShader: projectedFragment.replace(
      "if(interior.a>.99999){ colour=vec4(interior.rgb,wallAlpha); return; }",
      "colour=interior; return;",
    ),
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    side: THREE.FrontSide,
  })
  const roomSurface = new THREE.Mesh(new THREE.PlaneGeometry(4.44, 3.15), roomMaterial)
  roomSurface.name = "home-window-architecture"
  roomSurface.position.set(0, 1.575, REAR_WINDOW_Z)
  roomSurface.rotation.y = Math.PI
  roomSurface.renderOrder = 2
  world.add(roomSurface)
  const exteriorUniforms = {
    ...homeUniforms,
    homeProjection: { value: projection },
    uInteriorOpacity: { value: 0 },
  }
  const exteriorVertex = projectedVertex
    .replace("out vec4 homePhoto;", "out vec4 homePhoto; out vec3 exteriorPoint;")
    .replace("homePhoto=photo;", "homePhoto=photo; exteriorPoint=world.xyz;")
  const exteriorFragment = projectedFragment
    .replace(
      "void main(){",
      "in vec3 exteriorPoint; uniform float waterDetail; uniform vec3 cameraPosition; uniform sampler2D uPanorama; uniform mat3 uPanoramaProjection; uniform float uPanoramaBlend; void main(){ if(exteriorPoint.z<2.4) discard;",
    )
    .replace(
      "  float mask=waterMask(p);",
      `
      vec2 sourcePoint=p;
      float mask=waterMask(p);`,
    )
    .replace(
      "  colour=vec4(mix(exterior,interior.rgb,interior.a)",
      `
      // Feature-registered outpainting supplies a single continuous wider field.
      // Hand off the source on these same surfaces, avoiding an inset image.
      vec3 registered=uPanoramaProjection*vec3(sourcePoint,1.);
      vec2 panoramaUv=registered.xy/registered.z;
      vec3 periphery=texture(uPanorama,vec2(panoramaUv.x,1.-panoramaUv.y)).rgb;
      float sourceCoverage=rise(0.,.025,sourcePoint.x)*(1.-rise(.975,1.,sourcePoint.x))
        *rise(0.,.025,sourcePoint.y)*(1.-rise(.975,1.,sourcePoint.y));
      exterior=mix(periphery,exterior,sourceCoverage*(1.-uPanoramaBlend));
      // At grazing angles, retain the photographic colour/reflection and use
      // water detail at a fixed world scale instead of magnifying image pixels.
      vec2 q=exteriorPoint.xz*vec2(.31,.49);
      q+=spectralWaterDirection(q*.2,uTime)*.012;
      q=1.-abs(mod(q,2.)-1.);
      vec3 detail=texture(uPanorama,vec2(.35+.55*q.x,1.-(.73+.20*q.y))).rgb;
      float nearWater=waterDetail*(1.-rise(4.,18.,distance(cameraPosition,exteriorPoint)));
      float beyondWater=rise(.96,1.,panoramaUv.y);
      exterior=mix(exterior,detail,max(nearWater*.75,beyondWater));
      colour=vec4(mix(exterior,interior.rgb,interior.a)`,
    )
  const exteriorMaterial = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: { ...exteriorUniforms, waterDetail: { value: 0 } },
    vertexShader: exteriorVertex,
    fragmentShader: exteriorFragment,
    side: THREE.DoubleSide,
    toneMapped: false,
  })
  const waterMaterial = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: { ...exteriorUniforms, waterDetail: { value: 0 } },
    vertexShader: exteriorVertex,
    fragmentShader: exteriorFragment,
    side: THREE.DoubleSide,
    toneMapped: false,
  })
  // A single landscape, split at the photographed far bank: mountains above
  // the water and a horizontal lake below. No photograph lives on the glass.
  const mountains = new THREE.Mesh(new THREE.BufferGeometry(), exteriorMaterial)
  mountains.name = "distant-mountains"
  const lake = new THREE.Mesh(new THREE.BufferGeometry(), waterMaterial)
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
          positions.push(point.x, point.y, point.z)
          if (x < columns && y < rows) {
            const i = y * (columns + 1) + x
            indices.push(i, i + 1, i + columns + 1, i + 1, i + columns + 2, i + columns + 1)
          }
        }
      }
      mesh.geometry.dispose()
      mesh.geometry = new THREE.BufferGeometry()
      mesh.geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
      mesh.geometry.setIndex(indices)
      mesh.geometry.computeBoundingSphere()
    }
  }
  const loaded = new Set<THREE.Texture>()
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
    failed = true
    world.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose()
        for (const material of Array.isArray(object.material) ? object.material : [object.material])
          material.dispose()
      }
    })
    for (const texture of loaded) texture.dispose()
    scene.remove(world)
    throw error
  }
  resize(1, 1)
  const update = (progress: number, seconds: number, pointer: THREE.Vector2, publish = true) => {
    homeUniforms.uTime.value = seconds * SPECTRAL_PLAYBACK_RATE
    homeUniforms.uWorldTime.value = seconds
    homeUniforms.uAmbientBlend.value = Math.min(1, seconds / 1.2)
    const departing = Math.abs(progress)
    homeUniforms.uPanoramaBlend.value = THREE.MathUtils.smoothstep(departing, 0, 0.012)
    waterMaterial.uniforms.waterDetail.value = THREE.MathUtils.smoothstep(progress, 0.08, 0.35)
    homeUniforms.uOpacity.value = 1
    const look = homeWindowLook(pointer.x, pointer.y, homeProjection.opening.height)
    homeUniforms.uLook.value.set(look.x, look.y)
    surface.visible = progress === 0
    // Only the room photograph recedes into the existing room materials. The
    // landscape is always opaque and is never alpha-blended with another view.
    const roomBlend = progress < 0 ? 1 - THREE.MathUtils.smoothstep(departing, 0.04, 0.24) : 1
    homeUniforms.uInteriorOpacity.value = roomBlend
    roomSurface.visible = progress !== 0 && roomBlend > 0
    frame.opacity = 1 - roomBlend
    interior.visible = frame.opacity > 0
    outside.visible = progress !== 0
    model.visible = progress < 0
    scene.background = progress === -1 ? null : new THREE.Color(progress > 0 ? 0xcbdce5 : 0xdfe4e6)
    const stage =
      publish && typeof document !== "undefined"
        ? document.querySelector<HTMLElement>("[data-home-scene]")
        : null
    if (stage) {
      stage.dataset.homeRendering = "dynamic"
      stage.dataset.homeAmbientBlend = homeUniforms.uAmbientBlend.value.toFixed(3)
      stage.dataset.homeFieldTime = homeUniforms.uTime.value.toFixed(4)
      stage.dataset.homeWorldTime = seconds.toFixed(3)
      stage.dataset.homeReflectionStatus = "disabled-registration"
      stage.dataset.homeLook = homeUniforms.uLook.value
        .toArray()
        .map((n) => n.toFixed(3))
        .join(",")
    }
    return { width, height }
  }
  return { time: homeUniforms.uTime, resize, update }
}
