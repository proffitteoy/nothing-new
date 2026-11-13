import { styleText } from "node:util"

import config from "../quartz.config"
import { emitContent } from "./processors/emit"
import { filterContent } from "./processors/filter"
import { parseMarkdown } from "./processors/parse"
import type { FilePath } from "./util/path"
import { joinSegments, slugifyFilePath } from "./util/path"
import { PerfTimer } from "./util/perf"
import { glob } from "./util/glob"
import { trace } from "./util/trace"
import type { Argv, BuildCtx } from "./util/ctx"

async function buildNotes(argv: Argv) {
  const ctx: BuildCtx = {
    buildId: crypto.randomUUID(),
    argv,
    cfg: config,
    allSlugs: [],
    allFiles: [],
    incremental: false,
  }
  const perf = new PerfTimer()

  perf.addEvent("glob")
  const allFiles = await glob("**/*.*", argv.directory, config.configuration.ignorePatterns)
  const markdownPaths = allFiles.filter((file) => file.endsWith(".md")).sort()
  console.log(
    `Found ${markdownPaths.length} input files from \`${argv.directory}\` in ${perf.timeSince("glob")}`,
  )

  ctx.allFiles = allFiles
  ctx.allSlugs = allFiles.map((file) => slugifyFilePath(file as FilePath))
  const paths = markdownPaths.map((file) => joinSegments(argv.directory, file) as FilePath)
  const parsed = await parseMarkdown(ctx, paths)
  const filtered = filterContent(ctx, parsed)

  await emitContent(ctx, filtered)
  console.log(
    styleText("green", `Done processing ${markdownPaths.length} files in ${perf.timeSince()}`),
  )
}

export default async function run(argv: Argv) {
  try {
    await buildNotes(argv)
  } catch (error) {
    trace("\nExiting note build due to a fatal error", error as Error)
  }
}
