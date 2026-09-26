// Encode Blender's four composition renders without changing their content.
import sharp from "sharp"
import { fileURLToPath } from "node:url"
import { unlink } from "node:fs/promises"

for (const name of ["day", "night", "detail", "mobile"]) {
  const source = new URL(`../public/projects-room/${name}.png`, import.meta.url)
  const target = new URL(`../public/projects-room/${name}.webp`, import.meta.url)
  await sharp(fileURLToPath(source))
    .webp({ quality: 88, alphaQuality: 90 })
    .toFile(fileURLToPath(target))
  await unlink(source)
}
