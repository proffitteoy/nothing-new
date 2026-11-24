import assert from "node:assert/strict"
import fs from "node:fs/promises"
import path from "node:path"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { fileURLToPath } from "node:url"
import { test } from "node:test"

test("public notes and images sync while PDFs require their own explicit approval", async (t) => {
  const root = fileURLToPath(new URL("../", import.meta.url))
  const directory = await fs.mkdtemp(path.join(root, ".sync", "tmp-paper-pdf-test-"))
  t.after(() => fs.rm(directory, { recursive: true, force: true }))
  await fs.mkdir(path.join(directory, "source"))
  await fs.mkdir(path.join(directory, "content"))
  await fs.writeFile(
    path.join(directory, "source/note.md"),
    "# Public\n\n![[image.png]]\n\n[Paper](paper.pdf)",
  )
  await fs.writeFile(path.join(directory, "source/image.png"), "image")
  await fs.writeFile(path.join(directory, "source/paper.pdf"), "private paper")
  await fs.writeFile(path.join(directory, "include.txt"), "note.md\npaper.pdf\n")
  const config = {
    sourceRoot: "source",
    targetRoot: "content",
    includeFile: "include.txt",
    excludeFile: "exclude.txt",
    stateFile: "state.json",
    publicPdfFiles: [],
  }
  const writeConfig = () =>
    fs.writeFile(
      path.join(directory, "obsidian-sync.config.mjs"),
      `export default ${JSON.stringify(config)}`,
    )
  await writeConfig()
  const run = () =>
    promisify(execFile)(
      process.execPath,
      [path.join(root, "scripts/obsidian-sync.mjs"), "--skip-review"],
      { cwd: directory },
    )
  await run()
  assert.equal(await fs.readFile(path.join(directory, "content/image.png"), "utf8"), "image")
  await assert.rejects(fs.access(path.join(directory, "content/paper.pdf")))
  config.publicPdfFiles.push("paper.pdf")
  await writeConfig()
  await run()
  assert.equal(
    await fs.readFile(path.join(directory, "content/paper.pdf"), "utf8"),
    "private paper",
  )
})
