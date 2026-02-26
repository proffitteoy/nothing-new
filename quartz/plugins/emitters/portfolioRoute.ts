import fs from "fs"
import path from "path"
import { FilePath } from "../../util/path"
import { QuartzEmitterPlugin } from "../types"
import { glob } from "../../util/glob"

type Options = {
  sourceDir: string
  targetDir: string
}

const defaultOptions: Options = {
  sourceDir: "portfolio",
  targetDir: "portfolio",
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

      const files = await glob("**/*", sourcePath, [])
      for (const relativePath of files) {
        const sourceFile = path.join(sourcePath, relativePath)
        const targetFile = path.join(targetRoot, relativePath)
        await fs.promises.mkdir(path.dirname(targetFile), { recursive: true })
        await fs.promises.copyFile(sourceFile, targetFile)
        yield targetFile as FilePath
      }
    },
    async *partialEmit() {},
  }
}
