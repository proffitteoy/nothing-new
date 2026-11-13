import type { QuartzConfig } from "../cfg"
import type { FilePath, FullSlug } from "./path"

export interface Argv {
  directory: string
  verbose: boolean
  concurrency?: number
}

export interface BuildCtx {
  buildId: string
  argv: Argv
  cfg: QuartzConfig
  allSlugs: FullSlug[]
  allFiles: FilePath[]
  incremental: boolean
}

export type WorkerSerializableBuildCtx = Omit<BuildCtx, "cfg">
