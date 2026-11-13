import { randomUUID } from "node:crypto"
import { styleText } from "node:util"
import esbuild from "esbuild"
import { sassPlugin } from "esbuild-sass-plugin"

import { cacheFile, fp, version } from "./constants.js"

export async function handleBuild(argv) {
  console.log(`\n${styleText(["bgGreen", "black"], ` Notes v${version} `)} \n`)

  await esbuild.build({
    entryPoints: [fp],
    outfile: cacheFile,
    bundle: true,
    keepNames: true,
    minifyWhitespace: true,
    minifySyntax: true,
    platform: "node",
    format: "esm",
    packages: "external",
    sourcemap: true,
    sourcesContent: false,
    plugins: [
      sassPlugin({
        type: "css-text",
        cssImports: true,
      }),
    ],
  })

  const { default: buildNotes } = await import(`../../${cacheFile}?update=${randomUUID()}`)
  await buildNotes(argv)
}
