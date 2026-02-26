import fs from "fs"
import path from "path"
import { FullSlug } from "../../util/path"
import { QuartzEmitterPlugin } from "../types"
import { write } from "./helpers"

type Options = {
  source: string
  target: FullSlug
}

const defaultOptions: Options = {
  source: "Portfolio.html",
  target: "portfolio/index" as FullSlug,
}

export const PortfolioRoute: QuartzEmitterPlugin<Partial<Options>> = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts }

  return {
    name: "PortfolioRoute",
    async *emit(ctx) {
      const sourcePath = path.resolve(opts.source)
      if (!fs.existsSync(sourcePath)) {
        return
      }

      const html = await fs.promises.readFile(sourcePath)
      yield write({
        ctx,
        slug: opts.target,
        ext: ".html",
        content: html,
      })
    },
    async *partialEmit() {},
  }
}

