import * as THREE from "three"
import { Reflector } from "three/addons/objects/Reflector.js"
import { HOME_POSITION, HOME_TARGET, REAR_WINDOW_Z } from "./world-camera"
import { homeWindowLook } from "./home-scene"
import { HOME_WINDOW_FRAGMENT } from "../components/field/homeWindowShader"
import { SPECTRAL_DIRECTION_GLSL, SPECTRAL_PLAYBACK_RATE } from "../components/field/spectralField"

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
  const frame = new THREE.MeshBasicMaterial({ color: 0x9c866e, toneMapped: false })
  const earth = new THREE.MeshLambertMaterial({ color: 0x788474 })
  const shore = new THREE.MeshLambertMaterial({ color: 0x9b9d90 })
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
    uSize: { value: new THREE.Vector2() },
    uRoomRect: { value: new THREE.Vector4() },
    uLakeRect: { value: new THREE.Vector4() },
    uLook: { value: new THREE.Vector2() },
    uStrength: { value: 2.8 },
    uTime: { value: 0 },
    uWorldTime: { value: 0 },
    uAmbientBlend: { value: 0 },
    uInteriorOpacity: { value: 0 },
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
      depthWrite: false,
      toneMapped: false,
      vertexShader: `precision highp float;
      uniform mat4 projectionMatrix,modelViewMatrix;
      in vec3 position; in vec2 uv; out vec2 homeUv;
      void main(){homeUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: HOME_WINDOW_FRAGMENT,
    }),
  )
  surface.name = "original-home-window"
  surface.renderOrder = 10
  surface.frustumCulled = false
  world.add(surface)
  const referenceHome = new THREE.PerspectiveCamera(47, 1, 0.05, 700)
  referenceHome.position.copy(HOME_POSITION)
  referenceHome.lookAt(HOME_TARGET)
  referenceHome.updateMatrixWorld()
  surface.position.set(0, 1.575, REAR_WINDOW_Z + 0.004)
  surface.rotation.y = Math.PI
  surface.scale.set(4.44, 3.15, 1)
  let width = 1,
    height = 1
  const resize = (w: number, h: number) => {
    width = w
    height = h
    // Texture coordinates belong to the full floor-to-ceiling opening.
    const pictureHeight = (1440 * 3.15) / 4.44
    const scale = Math.max(1440 / 1672, pictureHeight / 877)
    homeUniforms.uSize.value.set(1440, pictureHeight)
    homeUniforms.uRoomRect.value.set(0, 0, 1440, pictureHeight)
    homeUniforms.uLakeRect.value.set(
      (1440 - 1672 * scale) / 2,
      (pictureHeight - 877 * scale) / 2,
      1672 * scale,
      877 * scale,
    )
  }
  box("near-ground", [600, 0.2, 600], [0, -0.27, 297.5], earth)
  for (const sign of [-1, 1]) {
    box("lake-bank", [180, 0.22, 300], [sign * 160, -0.25, -152], earth)
  }
  box("stone-shore", [140, 0.08, 2.8], [0, -0.04, -3.6], shore)
  // Small grounded stones provide a near-field scale cue independent of the panorama.
  const stoneGeometry = new THREE.DodecahedronGeometry(1, 0)
  for (let i = 0; i < 35; i++) {
    const stone = new THREE.Mesh(stoneGeometry, shore)
    stone.position.set(Math.sin(i * 6.7) * 9, 0.04, -3.7 + Math.cos(i * 2.4) * 0.8)
    stone.scale.set(0.1 + (i % 4) * 0.04, 0.07, 0.09 + (i % 3) * 0.05)
    outside.add(stone)
  }
  scene.add(new THREE.HemisphereLight(0xe6f2ff, 0x6f735c, 2.3))
  const sun = new THREE.DirectionalLight(0xfff7e9, 2.1)
  sun.position.set(-12, 25, 8)
  scene.add(sun)
  const reference = new THREE.PerspectiveCamera(47, 1672 / 877, 0.05, 700)
  reference.position.copy(HOME_POSITION)
  reference.lookAt(HOME_TARGET)
  reference.updateMatrixWorld(true)
  const projection = new THREE.Matrix4().multiplyMatrices(
    reference.projectionMatrix,
    reference.matrixWorldInverse,
  )
  const uniforms = {
    photograph: { value: null as THREE.Texture | null },
    projection: { value: projection },
    horizonBias: {
      value: 0.375 - (new THREE.Vector3(HOME_POSITION.x, 0, 180).project(reference).y * 0.5 + 0.5),
    },
    time: { value: 0 },
  }
  const vertexShader = `
    varying vec4 photo; varying vec3 worldPoint;
    uniform mat4 projection;
    void main() {
      vec4 world = modelMatrix * vec4(position,1.);
      worldPoint=world.xyz; photo=projection*world;
      gl_Position=projectionMatrix*viewMatrix*world;
    }`
  // Reflect the actual world into one bounded target in the same renderer.
  // No photographed water pixels are projected or stretched onto this surface.
  const lake = new Reflector(new THREE.PlaneGeometry(140, 290), {
    color: 0x174958,
    textureWidth: 768,
    textureHeight: 768,
    multisample: 0,
    clipBias: 0.002,
    shader: {
      name: "LakeWater",
      uniforms: {
        color: { value: null },
        tDiffuse: { value: null },
        textureMatrix: { value: null },
        time: { value: 0 },
      },
      vertexShader: `
        uniform mat4 textureMatrix;
        varying vec4 mirrorCoord; varying vec3 worldPoint;
        void main() {
          vec4 world=modelMatrix*vec4(position,1.);
          worldPoint=world.xyz;
          mirrorCoord=textureMatrix*vec4(position,1.);
          gl_Position=projectionMatrix*viewMatrix*world;
        }`,
      fragmentShader: `
        uniform sampler2D tDiffuse; uniform vec3 color; uniform float time;
        varying vec4 mirrorCoord; varying vec3 worldPoint;
        ${SPECTRAL_DIRECTION_GLSL}
        vec2 ripple(vec2 p,vec2 direction,float k,float speed,float strength,float footprint) {
          vec2 d=normalize(direction);
          float filtered=exp(-.5*k*k*footprint*footprint);
          return d*strength*filtered*cos(dot(p,d)*k+time*speed);
        }
        void main() {
          vec2 p=worldPoint.xz;
          float footprint=max(length(dFdx(p)),length(dFdy(p)));
          vec2 slope=ripple(p,vec2(1.,.36),11.,.9,.018,footprint)
            +ripple(p,vec2(-.43,1.),18.,-.7,.012,footprint)
            +ripple(p,vec2(.74,-.67),31.,1.3,.014,footprint)
            +ripple(p,vec2(.21,1.),49.,-.9,.010,footprint)
            +ripple(p,vec2(-.86,.51),73.,1.7,.008,footprint);
          vec2 field=spectralWaterDirection(p*.08,time);
          slope+=field*.006*sin(dot(p,vec2(.7,1.1))+time*.45);
          vec3 normal=normalize(vec3(-slope.x,1.,-slope.y));
          vec3 view=normalize(cameraPosition-worldPoint);
          float distanceToEye=length(cameraPosition-worldPoint);
          vec2 uv=mirrorCoord.xy/mirrorCoord.w;
          uv+=normal.xz*(.11+.10/max(distanceToEye,.3));
          vec3 reflection=texture2D(tDiffuse,clamp(uv,vec2(.002),vec2(.998))).rgb;
          float fresnel=.02037+.97963*pow(1.-max(dot(view,normal),0.),5.);
          vec3 water=mix(color,reflection,fresnel);
          vec3 sun=normalize(vec3(-12.,25.,8.));
          water+=vec3(1.,.96,.88)*pow(max(dot(reflect(-sun,normal),view),0.),180.)*.18;
          gl_FragColor=vec4(water,1.);
          #include <colorspace_fragment>
        }`,
    },
  })
  const water = lake.material as THREE.ShaderMaterial
  water.uniforms.time = uniforms.time
  water.toneMapped = false
  lake.name = "lake-water"
  lake.rotation.x = -Math.PI / 2
  lake.position.set(0, -0.01, -149.5)
  outside.add(lake)
  const mountains = new THREE.Mesh(
    new THREE.PlaneGeometry(520, 110),
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader: `
      uniform sampler2D photograph; uniform float horizonBias; varying vec4 photo;
      void main(){
        vec2 uv=photo.xy/photo.w*.5+.5;
        uv.y+=horizonBias;
        gl_FragColor=vec4(texture2D(photograph,clamp(uv,vec2(.002),vec2(.998))).rgb,1.);
        #include <colorspace_fragment>
      }`,
      toneMapped: false,
      side: THREE.DoubleSide,
    }),
  )
  mountains.name = "distant-mountains"
  mountains.position.set(0, 54.95, -180)
  outside.add(mountains)
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
  ] as const
  const files = [
    "convict-lake-day-study.webp",
    "observation-room-open.webp",
    "ambient-sky.webp",
    "ambient-clouds.webp",
    "ambient-branch.webp",
    "ambient-sky-region.png",
    "ambient-room-light.png",
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
    const terrain = homeUniforms.uLake.value!.clone()
    terrain.colorSpace = THREE.SRGBColorSpace
    terrain.needsUpdate = true
    loaded.add(terrain)
    uniforms.photograph.value = terrain
  } catch (error) {
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
  resize(1, 1)
  const update = (progress: number, seconds: number, pointer: THREE.Vector2, publish = true) => {
    homeUniforms.uTime.value = seconds * SPECTRAL_PLAYBACK_RATE
    homeUniforms.uWorldTime.value = seconds
    homeUniforms.uAmbientBlend.value = Math.min(1, seconds / 1.2)
    homeUniforms.uReveal.value = THREE.MathUtils.smoothstep(progress, 0.04, 0.18)
    const look = homeWindowLook(pointer.x, pointer.y, (1440 * 3.15) / 4.44)
    homeUniforms.uLook.value.set(look.x, look.y)
    surface.visible = true
    interior.visible = true
    outside.visible = progress > 0
    model.visible = progress <= 0
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
  return { time: uniforms.time, resize, update }
}
