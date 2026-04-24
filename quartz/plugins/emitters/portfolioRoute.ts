import fs from "fs"
import path from "path"
import { FilePath } from "../../util/path"
import { QuartzEmitterPlugin } from "../types"

type Options = {
  sourceDir: string
  targetDir: string
}

const defaultOptions: Options = {
  sourceDir: "my-portfolio/dist",
  targetDir: "portfolio",
}

async function* copyDir(
  sourcePath: string,
  targetRoot: string,
): AsyncGenerator<FilePath> {
  const entries = await fs.promises.readdir(sourcePath, { withFileTypes: true })
  for (const entry of entries) {
    const src = path.join(sourcePath, entry.name)
    const dest = path.join(targetRoot, entry.name)
    if (entry.isDirectory()) {
      yield* copyDir(src, dest)
    } else {
      await fs.promises.mkdir(path.dirname(dest), { recursive: true })
      await fs.promises.copyFile(src, dest)
      yield dest as FilePath
    }
  }
}

export const PortfolioRoute: QuartzEmitterPlugin<Partial<Options>> = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts }

  return {
    name: "PortfolioRoute",
    async *emit(ctx) {
      const sourcePath = path.resolve(opts.sourceDir)
      if (!fs.existsSync(sourcePath)) {
        return
      }

      const sourceStat = await fs.promises.stat(sourcePath)
      const targetRoot = path.resolve(ctx.argv.output, opts.targetDir)

      if (sourceStat.isFile()) {
        const targetIndex = path.join(targetRoot, "index.html")
        await fs.promises.mkdir(path.dirname(targetIndex), { recursive: true })
        await fs.promises.copyFile(sourcePath, targetIndex)
        yield targetIndex as FilePath
        return
      }

      yield* copyDir(sourcePath, targetRoot)
    },
    async *partialEmit() {},
  }
}
