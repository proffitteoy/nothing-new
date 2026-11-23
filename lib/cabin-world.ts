import * as THREE from "three"
import { Reflector } from "three/addons/objects/Reflector.js"
import { HOME_POSITION, HOME_TARGET } from "./world-camera"
import { SPECTRAL_DIRECTION_GLSL } from "../components/field/spectralField"

// Remove the baked sky panels and centre mullion, keeping the original wall,
// sill, furniture and atlas. BVHs must be built after this geometry change.
export function openCabinWindows(model: THREE.Group) {
  model.updateMatrixWorld(true)
  const point = new THREE.Vector3()
  for (const name of ["wall_back", "wall_left"]) {
    const wall = model.getObjectByName(name) as THREE.Mesh<THREE.BufferGeometry>
    const geometry = wall.geometry
    const positions = geometry.getAttribute("position")
    const index = geometry.getIndex()
    const retained: number[] = []
    for (let i = 0; i < (index?.count ?? positions.count); i += 3) {
      const ids = [0, 1, 2].map((j) => (index ? index.getX(i + j) : i + j))
      const remove = ids.every((id) => {
        point.fromBufferAttribute(positions, id).applyMatrix4(wall.matrixWorld)
        return name === "wall_back"
          ? (point.x > -1.695 &&
              point.x < -0.285 &&
              point.y > 1.285 &&
              point.y < 2.555 &&
              point.z < -1.72) ||
              (Math.abs(point.x + 0.99) < 0.02 &&
                point.y > 1.25 &&
                point.y < 2.59 &&
                point.z < -1.6)
          : point.x < -2.34 && point.y > 0.89 && point.y < 2.71
      })
      if (!remove) retained.push(...ids)
    }
    geometry.setIndex(retained)
    geometry.computeBoundingBox()
  }
}

export async function buildCabinWorld(scene: THREE.Scene) {
  const world = new THREE.Group()
  world.name = "cabin-lake-world"
  scene.add(world)
  scene.background = new THREE.Color(0xcbdce5)
  const plaster = new THREE.MeshLambertMaterial({ color: 0xd7dcdd })
  const wood = new THREE.MeshLambertMaterial({ color: 0x827362 })
  const roof = new THREE.MeshLambertMaterial({ color: 0x535e69, side: THREE.DoubleSide })
  const earth = new THREE.MeshLambertMaterial({ color: 0x788474 })
  const shore = new THREE.MeshLambertMaterial({ color: 0x9b9d90 })
  const box = (name: string, size: number[], position: number[], material: THREE.Material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material)
    mesh.name = name
    mesh.position.set(position[0], position[1], position[2])
    world.add(mesh)
    return mesh
  }
  // The former open-front diorama now has an exterior. The desk camera (z=2.72)
  // is inside; the flight leaves and re-enters through a real, 1.7m-wide doorway.
  box("cabin-floor", [7, 0.12, 5.9], [0, -0.09, 1.25], wood)
  box("cabin-left-exterior", [0.16, 3.25, 5.9], [-3.58, 1.625, 1.25], plaster)
  box("cabin-right-exterior", [0.16, 3.25, 5.9], [3.58, 1.625, 1.25], plaster)
  box("cabin-front-left", [2.65, 3.25, 0.16], [-2.175, 1.625, 4.2], plaster)
  box("cabin-front-right", [2.65, 3.25, 0.16], [2.175, 1.625, 4.2], plaster)
  box("cabin-door-header", [1.7, 0.65, 0.16], [0, 2.925, 4.2], plaster)
  for (const sign of [-1, 1]) {
    const panel = box("cabin-pitched-roof", [3.98, 0.12, 6.35], [sign * 1.86, 3.67, 1.25], roof)
    panel.rotation.z = -sign * 0.23
  }
  const gable = new THREE.Shape()
  gable.moveTo(-3.58, 3.23)
  gable.lineTo(3.58, 3.23)
  gable.lineTo(0, 4.08)
  gable.closePath()
  for (const z of [-1.7, 4.2]) {
    const cap = new THREE.Mesh(new THREE.ShapeGeometry(gable), plaster)
    cap.material = plaster.clone()
    cap.material.side = THREE.DoubleSide
    cap.position.z = z
    world.add(cap)
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
    world.add(stone)
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
      value: 0.375 - (new THREE.Vector3(HOME_POSITION.x, 0, -180).project(reference).y * 0.5 + 0.5),
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
  world.add(lake)
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
  world.add(mountains)
  // Existing authorised photography belongs to the distant terrain only.
  try {
    uniforms.photograph.value = await new THREE.TextureLoader().loadAsync(
      "/home-window/convict-lake-day-study.webp",
    )
    // Shader samples source sRGB values directly, then performs output conversion.
    uniforms.photograph.value.colorSpace = THREE.SRGBColorSpace
  } catch (error) {
    world.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      if (object instanceof Reflector) object.getRenderTarget().dispose()
      object.geometry.dispose()
      for (const mat of Array.isArray(object.material) ? object.material : [object.material])
        mat.dispose()
    })
    scene.remove(world)
    throw error
  }
  return uniforms.time
}
