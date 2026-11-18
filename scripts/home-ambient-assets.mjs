// Offline asset export. Photographic edits come from imagegen; this script only
// normalizes/crops those exports and authors registered numeric data maps.
import sharp from "sharp"
import { readFile, writeFile } from "node:fs/promises"

const source = process.argv[2] ?? ".sync/tmp-ambient-window/source"
const output = "public/home-window"
const width = 1672,
  height = 877
const clamp = (v) => Math.max(0, Math.min(1, v))

await sharp(`${source}/sky-corrected.png`)
  .resize(width, height)
  .webp({ quality: 90 })
  .toFile(`${output}/ambient-sky.webp`)
await sharp(`${source}/clouds.png`)
  .resize(width, height)
  .extract({ left: 0, top: 0, width, height: 316 })
  .webp({ lossless: true })
  .toFile(`${output}/ambient-clouds.webp`)
await sharp(`${source}/branch.png`)
  .resize(width, height)
  .extract({ left: 0, top: 0, width: 168, height: 246 })
  .webp({ lossless: true })
  .toFile(`${output}/ambient-branch.webp`)

// Stop at the FIRST non-sky pixel in each column, rather than flooding into
// blue-grey mountain faces. The upper branch is handled separately below.
const rgb = await sharp(`${output}/convict-lake-day-study.webp`).removeAlpha().raw().toBuffer()
function sky(i) {
  const r = rgb[i * 3],
    g = rgb[i * 3 + 1],
    b = rgb[i * 3 + 2]
  return b > 145 && g > 95 && b - r > 42 && b - g > 15
}
const ridge = new Int32Array(width)
for (let x = 0; x < width; x++) {
  let y = 170
  while (y < height * 0.57 && sky(y * width + x)) y++
  ridge[x] = x < 200 ? 280 + x * 0.25 : y
}
const mask = new Uint8Array(width * height)
for (let y = 0; y < height; y++)
  for (let x = 0; x < width; x++) {
    const i = y * width + x
    let v = clamp((ridge[x] - 2 - y) / 3)
    // Keep the lower source foliage as a stationary root; the sprite replaces
    // only the upper branch. No doubled tree is allowed at the join.
    if (
      x < 170 &&
      y > height * 0.22 &&
      rgb[i * 3 + 1] > rgb[i * 3] + 3 &&
      rgb[i * 3 + 1] > rgb[i * 3 + 2]
    )
      v = 0
    mask[i] = Math.round(v * 255)
  }
await sharp(mask, { raw: { width, height, channels: 1 } })
  .png()
  .toFile(`${output}/ambient-sky-region.png`)

// Choose one fixed upper-left light direction on a cloud edge. This is a
// designed camera-space sun anchor, not a recovered physical measurement.
const cloud = await sharp(`${output}/ambient-clouds.webp`).ensureAlpha().raw().toBuffer()
let best = -1,
  sun = [0.18, 0.08]
for (let y = 35; y < 150; y++)
  for (let x = 200; x < 480; x++) {
    const a = cloud[(y * width + x) * 4 + 3] / 255
    const before = cloud[(y * width + x - 16) * 4 + 3] / 255
    const score = Math.abs(a - before) * (a > 0.1 && a < 0.95 ? 1 : 0.2)
    if (score > best) {
      best = score
      sun = [Math.round((x / width) * 255) / 255, Math.round((y / height) * 255) / 255]
    }
  }
const mapWidth = 512,
  mapHeight = 320,
  lighting = new Uint8Array(mapWidth * mapHeight * 3)
const faces = [
  {
    p: [
      [94, 44],
      [197, 126],
      [197, 737],
      [94, 794],
    ],
    direct: 0.55,
    depth: 0.08,
  },
  {
    p: [
      [1490, 44],
      [1390, 126],
      [1390, 737],
      [1490, 794],
    ],
    direct: 0.18,
    depth: 0.08,
  },
  {
    p: [
      [94, 44],
      [1490, 44],
      [1390, 126],
      [197, 126],
    ],
    direct: 0.12,
    depth: 0.06,
  },
  {
    p: [
      [197, 737],
      [1390, 737],
      [1513, 813],
      [73, 813],
    ],
    direct: 0.8,
    depth: 0.1,
  },
  {
    p: [
      [83, 814],
      [1504, 814],
      [1504, 945],
      [83, 945],
    ],
    direct: 0.2,
    depth: 0.25,
  },
  {
    p: [
      [0, 992],
      [83, 945],
      [1504, 945],
      [1585, 992],
    ],
    direct: 0.25,
    depth: 0.45,
  },
]
function inside(x, y, polygon) {
  let hit = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i],
      b = polygon[j]
    if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) hit = !hit
  }
  return hit
}
for (let y = 0; y < mapHeight; y++)
  for (let x = 0; x < mapWidth; x++) {
    const px = ((x + 0.5) / mapWidth) * 1585,
      py = ((y + 0.5) / mapHeight) * 992
    const face = faces.find((f) => inside(px, py, f.p)),
      i = (y * mapWidth + x) * 3
    // Each receiver maps a parallel light ray back to the same distant cloud
    // plane, with only a small parallax due to room position and depth.
    lighting[i] = Math.round(
      clamp(sun[0] + (px / 1585 - 0.5) * 0.008 + (face?.depth ?? 0) * 0.004) * 255,
    )
    lighting[i + 1] = Math.round(
      clamp(sun[1] + (py / 992 - 0.5) * 0.004 + (face?.depth ?? 0) * 0.006) * 255,
    )
    lighting[i + 2] = Math.round((face?.direct ?? 0) * 255)
  }
await sharp(lighting, { raw: { width: mapWidth, height: mapHeight, channels: 3 } })
  .png()
  .toFile(`${output}/ambient-room-light.png`)
const metadata = {
  source: [width, height],
  cloudRect: [0, 0, width, 316],
  branchRect: [0, 0, 168, 246],
  sunUv: sun,
  skyGuardPixels: 2,
  skyFeatherPixels: 3,
  skyMethod:
    "first non-sky per column below y170; hand-protected left foliage; coarse manual envelope rejected",
  roomLight: {
    size: [mapWidth, mapHeight],
    channels: { r: "cloud receiver u", g: "cloud receiver v", b: "authored direct-light fraction" },
    faces,
  },
  note: "Fixed-view artistic transport approximation; not recovered albedo, geometry or physical irradiance.",
}
await writeFile(`${source}/registration.json`, JSON.stringify(metadata, null, 2))
console.log(
  JSON.stringify(
    {
      sunUv: sun,
      cloudEdgeScore: best,
      skyPixels: mask.filter((v) => v > 127).length,
      assets: await Promise.all(
        [
          "ambient-sky.webp",
          "ambient-clouds.webp",
          "ambient-branch.webp",
          "ambient-sky-region.png",
          "ambient-room-light.png",
        ].map(async (name) => ({ name, bytes: (await readFile(`${output}/${name}`)).length })),
      ),
    },
    null,
    2,
  ),
)
