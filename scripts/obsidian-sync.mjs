#!/usr/bin/env node

import fs from "node:fs/promises"
import path from "node:path"
import readline from "node:readline/promises"
import { stdin as input, stdout as output } from "node:process"
import { pathToFileURL } from "node:url"
import { convertPathToPattern, globby } from "globby"
import { minimatch } from "minimatch"

const argv = new Set(process.argv.slice(2))
const dryRun = argv.has("--dry-run")
const check = argv.has("--check")
const initFromContent = argv.has("--init-from-content")
const force = argv.has("--force")
const reviewOnly = argv.has("--review")
const reviewAll = argv.has("--all")
const skipReview = argv.has("--skip-review")
const cwd = process.cwd()
const defaultConfigPath = path.resolve(cwd, "obsidian-sync.config.mjs")

const config = await loadConfig(defaultConfigPath)
let state = await readState(config.stateFile)

if (initFromContent) {
  state = await initializeIncludeFile(config, state, { force })
  await writeState(config.stateFile, state)
  process.exit(0)
}

const shouldReview = reviewOnly || (!dryRun && !check && !skipReview)
if (shouldReview) {
  const reviewResult = await reviewUndecidedNotes(config, state, {
    reviewAll,
    reviewOnly,
  })

  state = reviewResult.state
  if (reviewOnly) {
    process.exitCode = reviewResult.exitCode
    process.exit()
  }
}

await runSync(config, { dryRun, check, state })

async function loadConfig(configPath) {
  const configUrl = pathToFileURL(configPath).href
  const configModule = await import(configUrl)
  const rawConfig = configModule.default ?? configModule

  if (!rawConfig?.sourceRoot) {
    throw new Error("obsidian-sync.config.mjs 必须提供 sourceRoot")
  }

  const sourceRoot = resolvePath(rawConfig.sourceRoot)
  const targetRoot = resolvePath(rawConfig.targetRoot ?? "content")
  const includeFile = resolvePath(rawConfig.includeFile ?? ".sync/obsidian-sync.include.txt")
  const excludeFile = resolvePath(rawConfig.excludeFile ?? ".sync/obsidian-sync.exclude.txt")
  const stateFile = resolvePath(rawConfig.stateFile ?? ".sync/obsidian-sync-state.json")
  const reviewPatterns = normalizeGlobPatterns(rawConfig.reviewPatterns ?? ["**/*.md"])

  await ensureDirectory(path.dirname(includeFile))
  await ensureDirectory(path.dirname(excludeFile))
  await ensureDirectory(path.dirname(stateFile))

  return {
    sourceRoot,
    targetRoot,
    includeFile,
    excludeFile,
    stateFile,
    reviewPatterns,
    defaultIgnores: normalizeGlobPatterns(
      rawConfig.defaultIgnores ?? [".obsidian/**", "**/.obsidian/**"],
    ),
    extraIncludes: normalizeRuleEntries(rawConfig.extraIncludes ?? []),
    extraExcludes: normalizeRuleEntries(rawConfig.extraExcludes ?? []),
  }
}

async function initializeIncludeFile(config, state, options) {
  const currentEntries = await readRuleFile(config.includeFile)
  if (!options.force && currentEntries.length > 0) {
    throw new Error(
      `include 文件已有内容：${displayPath(config.includeFile)}。如需重建请使用 --force`,
    )
  }

  const targetFiles = await globby(["**/*"], {
    cwd: config.targetRoot,
    onlyFiles: true,
    dot: true,
    ignore: config.defaultIgnores,
  })

  const includeLines = []
  for (const relativePath of targetFiles.sort((left, right) =>
    left.localeCompare(right, "zh-CN"),
  )) {
    const normalized = toPosix(relativePath)
    const sourcePath = path.join(config.sourceRoot, normalized)
    if (await fileExists(sourcePath)) {
      includeLines.push(normalized)
    }
  }

  const lines = [
    "# 默认每行都是相对 E:/math 的字面路径。",
    "# 如需使用 glob，请写成 glob: math/**/*.md",
    "# 删除一行：停止同步对应文件；新增一行：允许同步对应文件。",
    "",
    ...includeLines,
    "",
  ]

  await fs.writeFile(config.includeFile, lines.join("\n"), "utf8")

  const notes = await collectReviewCandidates(config)
  const discoveredNotes = Object.fromEntries(
    notes.map((note) => [note.relativePath, note.fingerprint]),
  )

  console.log(
    `[obsidian-sync] 已生成 allowlist：${displayPath(config.includeFile)}（${includeLines.length} 条）`,
  )
  console.log(
    `[obsidian-sync] 已建立笔记扫描基线：${notes.length} 篇，以后只会询问新建或改动过的未决笔记`,
  )

  return {
    ...state,
    version: 2,
    managedFiles: includeLines.slice(),
    discoveredNotes,
  }
}

async function reviewUndecidedNotes(config, state, options) {
  await assertDirectoryExists(config.sourceRoot, "sourceRoot")

  const rules = await loadRules(config)
  const notes = await collectReviewCandidates(config)
  if (!options.reviewAll && Object.keys(state.discoveredNotes).length === 0) {
    const nextState = {
      ...state,
      version: 2,
      discoveredNotes: buildDiscoveredSnapshot(notes),
    }
    await writeState(config.stateFile, nextState)

    console.log(
      `[obsidian-sync] 首次建立笔记扫描基线：${notes.length} 篇。以后只会询问新建或改动过的未决笔记`,
    )
    if (options.reviewOnly) {
      console.log(
        "[obsidian-sync] 如果要重新审阅当前所有未决笔记，请运行 npm run sync:obsidian:review:all",
      )
    }

    return { state: nextState, exitCode: 0 }
  }

  const pendingNotes = notes.filter((note) => {
    if (matchesAnyRule(note.relativePath, rules.includeEntries, rules.excludeEntries)) {
      return false
    }

    if (options.reviewAll) {
      return true
    }

    return state.discoveredNotes[note.relativePath] !== note.fingerprint
  })

  if (pendingNotes.length === 0) {
    const nextState = {
      ...state,
      version: 2,
      discoveredNotes: buildDiscoveredSnapshot(notes),
    }
    await writeState(config.stateFile, nextState)
    return { state: nextState, exitCode: 0 }
  }

  if (!isInteractiveTerminal()) {
    console.log(
      `[obsidian-sync] 发现 ${pendingNotes.length} 篇未决笔记，但当前终端不可交互。请运行 npm run sync:obsidian:review`,
    )
    return { state, exitCode: options.reviewOnly ? 1 : 0 }
  }

  const rl = readline.createInterface({ input, output })
  const includeDecisions = []
  const excludeDecisions = []
  const nextDiscoveredNotes = buildDiscoveredSnapshot(
    notes.filter(
      (note) => !pendingNotes.some((pending) => pending.relativePath === note.relativePath),
    ),
  )

  let includeCount = 0
  let excludeCount = 0
  let skipCount = 0

  console.log("")
  console.log(
    `[obsidian-sync] 发现 ${pendingNotes.length} 篇未决笔记。输入 y=加入博客，n=永久忽略，s=暂时跳过，q=退出`,
  )

  for (let index = 0; index < pendingNotes.length; index += 1) {
    const note = pendingNotes[index]
    const title = await extractNoteTitle(note.sourcePath, note.relativePath)

    console.log("")
    console.log(`[${index + 1}/${pendingNotes.length}] ${note.relativePath}`)
    if (title) {
      console.log(`标题：${title}`)
    }

    while (true) {
      const answer = (await rl.question("加入博客？ [y/n/s/q] ")).trim().toLowerCase()

      if (answer === "y") {
        includeDecisions.push(note.relativePath)
        nextDiscoveredNotes[note.relativePath] = note.fingerprint
        includeCount += 1
        break
      }

      if (answer === "n") {
        excludeDecisions.push(note.relativePath)
        nextDiscoveredNotes[note.relativePath] = note.fingerprint
        excludeCount += 1
        break
      }

      if (answer === "s" || answer === "") {
        nextDiscoveredNotes[note.relativePath] = note.fingerprint
        skipCount += 1
        break
      }

      if (answer === "q") {
        await rl.close()
        await appendRuleLines(config.includeFile, includeDecisions)
        await appendRuleLines(config.excludeFile, excludeDecisions)

        const nextState = {
          ...state,
          version: 2,
          discoveredNotes: mergeKnownNotes(state.discoveredNotes, nextDiscoveredNotes),
        }
        await writeState(config.stateFile, nextState)

        console.log("")
        console.log(
          `[obsidian-sync] 已结束本轮审阅：加入 ${includeCount}，忽略 ${excludeCount}，跳过 ${skipCount}`,
        )

        return { state: nextState, exitCode: 0 }
      }
    }
  }

  await rl.close()
  await appendRuleLines(config.includeFile, includeDecisions)
  await appendRuleLines(config.excludeFile, excludeDecisions)

  const nextState = {
    ...state,
    version: 2,
    discoveredNotes: mergeKnownNotes(state.discoveredNotes, nextDiscoveredNotes),
  }
  await writeState(config.stateFile, nextState)

  console.log("")
  console.log(
    `[obsidian-sync] 审阅完成：加入 ${includeCount}，忽略 ${excludeCount}，跳过 ${skipCount}`,
  )

  return { state: nextState, exitCode: 0 }

  function mergeKnownNotes(previousNotes, reviewedNotes) {
    const merged = {}
    for (const note of notes) {
      const reviewedFingerprint = reviewedNotes[note.relativePath]
      if (reviewedFingerprint) {
        merged[note.relativePath] = reviewedFingerprint
        continue
      }

      const currentFingerprint = previousNotes[note.relativePath]
      if (currentFingerprint) {
        merged[note.relativePath] = currentFingerprint
      }
    }
    return merged
  }
}

async function runSync(config, options) {
  await assertDirectoryExists(config.sourceRoot, "sourceRoot")
  await assertDirectoryExists(config.targetRoot, "targetRoot")

  const rules = await loadRules(config)

  if (rules.includeEntries.length === 0) {
    throw new Error(
      `没有可同步的规则。先编辑 ${displayPath(config.includeFile)}，或运行 npm run sync:obsidian:init`,
    )
  }

  const matchedFiles = await globby(
    rules.includeEntries.map((entry) => entry.pattern),
    {
      cwd: config.sourceRoot,
      onlyFiles: true,
      dot: true,
      ignore: rules.excludeEntries.map((entry) => entry.pattern),
    },
  )

  const desiredFiles = new Map()
  for (const relativePath of matchedFiles) {
    await registerDesiredFile(config, desiredFiles, toPosix(relativePath))
  }

  const includedNotes = Array.from(desiredFiles.keys()).filter((relativePath) =>
    relativePath.toLowerCase().endsWith(".md"),
  )
  for (const relativePath of includedNotes) {
    const sourcePath = path.resolve(config.sourceRoot, relativePath)
    const assets = await collectReferencedAssets(
      config,
      relativePath,
      sourcePath,
      rules.excludeEntries,
    )
    for (const assetPath of assets) {
      await registerDesiredFile(config, desiredFiles, assetPath)
    }
  }

  const previousManagedFiles = new Set(options.state.managedFiles ?? [])
  const nextManagedFiles = new Set(desiredFiles.keys())

  const createOps = []
  const updateOps = []
  const unchangedOps = []

  for (const [relativePath, fileInfo] of desiredFiles) {
    const existsInTarget = await fileExists(fileInfo.targetPath)
    if (!existsInTarget) {
      createOps.push({ relativePath, ...fileInfo })
      continue
    }

    const same = await filesAreEqual(fileInfo.sourcePath, fileInfo.targetPath)
    if (same) {
      unchangedOps.push({ relativePath, ...fileInfo })
    } else {
      updateOps.push({ relativePath, ...fileInfo })
    }
  }

  const deleteOps = []
  for (const relativePath of previousManagedFiles) {
    if (nextManagedFiles.has(relativePath)) {
      continue
    }

    const targetPath = path.resolve(config.targetRoot, relativePath)
    assertInside(config.targetRoot, targetPath, "target")
    if (await fileExists(targetPath)) {
      deleteOps.push({ relativePath, targetPath })
    }
  }

  const changedCount = createOps.length + updateOps.length + deleteOps.length
  printSummary({
    matchedCount: desiredFiles.size,
    unchangedCount: unchangedOps.length,
    createCount: createOps.length,
    updateCount: updateOps.length,
    deleteCount: deleteOps.length,
    dryRun: options.dryRun,
    check: options.check,
  })

  if (options.check) {
    if (changedCount > 0) {
      process.exitCode = 1
    }
    return
  }

  if (options.dryRun) {
    return
  }

  for (const operation of createOps) {
    await ensureDirectory(path.dirname(operation.targetPath))
    await fs.copyFile(operation.sourcePath, operation.targetPath)
  }

  for (const operation of updateOps) {
    await ensureDirectory(path.dirname(operation.targetPath))
    await fs.copyFile(operation.sourcePath, operation.targetPath)
  }

  for (const operation of deleteOps) {
    await fs.rm(operation.targetPath, { force: true })
  }

  await writeState(config.stateFile, {
    ...options.state,
    version: 2,
    managedFiles: Array.from(nextManagedFiles).sort((left, right) =>
      left.localeCompare(right, "zh-CN"),
    ),
  })
}

function printSummary(summary) {
  const mode = summary.check ? "check" : summary.dryRun ? "dry-run" : "sync"
  console.log(
    `[obsidian-sync] ${mode}: 匹配 ${summary.matchedCount}，新增 ${summary.createCount}，更新 ${summary.updateCount}，删除 ${summary.deleteCount}，跳过 ${summary.unchangedCount}`,
  )
}

async function loadRules(config) {
  return {
    includeEntries: [...(await readRuleFile(config.includeFile)), ...config.extraIncludes],
    excludeEntries: [
      ...config.defaultIgnores.map((pattern) => createGlobRuleEntry(pattern)),
      ...(await readRuleFile(config.excludeFile)),
      ...config.extraExcludes,
    ],
  }
}

async function readRuleFile(filePath) {
  if (!(await fileExists(filePath))) {
    return []
  }

  const content = await fs.readFile(filePath, "utf8")
  return content
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map(parseRuleEntry)
}

async function readState(filePath) {
  if (!(await fileExists(filePath))) {
    return { version: 2, managedFiles: [], discoveredNotes: {} }
  }

  const content = await fs.readFile(filePath, "utf8")
  const state = JSON.parse(content)
  return {
    version: state.version ?? 2,
    managedFiles: Array.isArray(state.managedFiles) ? state.managedFiles.map(toPosix) : [],
    discoveredNotes:
      state.discoveredNotes && typeof state.discoveredNotes === "object"
        ? Object.fromEntries(
            Object.entries(state.discoveredNotes).map(([relativePath, fingerprint]) => [
              toPosix(relativePath),
              String(fingerprint),
            ]),
          )
        : {},
  }
}

async function writeState(filePath, state) {
  await ensureDirectory(path.dirname(filePath))
  await fs.writeFile(filePath, `${JSON.stringify(state, null, 2)}\n`, "utf8")
}

async function appendRuleLines(filePath, lines) {
  if (lines.length === 0) {
    return
  }

  const existingContent = (await fileExists(filePath)) ? await fs.readFile(filePath, "utf8") : ""
  const prefix = existingContent.length === 0 || existingContent.endsWith("\n") ? "" : "\n"
  const suffix = `${lines.join("\n")}\n`
  await fs.appendFile(filePath, `${prefix}${suffix}`, "utf8")
}

async function collectReviewCandidates(config) {
  const relativePaths = await globby(config.reviewPatterns, {
    cwd: config.sourceRoot,
    onlyFiles: true,
    dot: true,
    ignore: config.defaultIgnores,
  })

  const notes = []
  for (const relativePath of relativePaths.sort((left, right) =>
    left.localeCompare(right, "zh-CN"),
  )) {
    const normalized = toPosix(relativePath)
    const sourcePath = path.resolve(config.sourceRoot, normalized)
    assertInside(config.sourceRoot, sourcePath, "source")

    const stat = await fs.stat(sourcePath)
    notes.push({
      relativePath: normalized,
      sourcePath,
      fingerprint: `${Math.trunc(stat.mtimeMs)}:${stat.size}`,
    })
  }

  return notes
}

function buildDiscoveredSnapshot(notes) {
  return Object.fromEntries(notes.map((note) => [note.relativePath, note.fingerprint]))
}

function matchesAnyRule(relativePath, includeEntries, excludeEntries) {
  return (
    includeEntries.some((entry) => matchesRule(relativePath, entry)) ||
    excludeEntries.some((entry) => matchesRule(relativePath, entry))
  )
}

function matchesRule(relativePath, entry) {
  if (entry.kind === "literal") {
    return relativePath === entry.value
  }

  return minimatch(relativePath, entry.value, { dot: true })
}

async function registerDesiredFile(config, desiredFiles, relativePath) {
  const normalized = toPosix(relativePath)
  if (desiredFiles.has(normalized)) {
    return
  }

  const sourcePath = path.resolve(config.sourceRoot, normalized)
  const targetPath = path.resolve(config.targetRoot, normalized)

  assertInside(config.sourceRoot, sourcePath, "source")
  assertInside(config.targetRoot, targetPath, "target")

  if (!(await fileExists(sourcePath))) {
    return
  }

  desiredFiles.set(normalized, { sourcePath, targetPath })
}

async function collectReferencedAssets(config, noteRelativePath, noteSourcePath, excludeEntries) {
  const content = await fs.readFile(noteSourcePath, "utf8")
  const assetPaths = new Set()

  const wikiLinkPattern = /!?\[\[([^[\]]+?)\]\]/gu
  const markdownLinkPattern = /!?\[[^\]]*\]\(([^)]+)\)/gu

  for (const match of content.matchAll(wikiLinkPattern)) {
    const resolved = await resolveLinkedAsset(config.sourceRoot, noteRelativePath, match[1])
    if (resolved && !excludeEntries.some((entry) => matchesRule(resolved, entry))) {
      assetPaths.add(resolved)
    }
  }

  for (const match of content.matchAll(markdownLinkPattern)) {
    const destination = extractMarkdownDestination(match[1])
    const resolved = await resolveLinkedAsset(config.sourceRoot, noteRelativePath, destination)
    if (resolved && !excludeEntries.some((entry) => matchesRule(resolved, entry))) {
      assetPaths.add(resolved)
    }
  }

  return Array.from(assetPaths).sort((left, right) => left.localeCompare(right, "zh-CN"))
}

async function resolveLinkedAsset(sourceRoot, noteRelativePath, rawTarget) {
  const cleanedTarget = normalizeLinkedTarget(rawTarget)
  if (!cleanedTarget) {
    return null
  }

  const extension = path.posix.extname(cleanedTarget).toLowerCase()
  if (!extension || extension === ".md") {
    return null
  }

  const noteDirectory = path.posix.dirname(noteRelativePath)
  const candidates = []

  if (cleanedTarget.startsWith("/")) {
    candidates.push(cleanedTarget.slice(1))
  } else {
    candidates.push(path.posix.normalize(path.posix.join(noteDirectory, cleanedTarget)))
    candidates.push(path.posix.normalize(cleanedTarget))
  }

  for (const candidate of candidates) {
    const normalizedCandidate = toPosix(candidate)
    const candidatePath = path.resolve(sourceRoot, normalizedCandidate)
    if (!isInside(sourceRoot, candidatePath)) {
      continue
    }

    if (await fileExists(candidatePath)) {
      return normalizedCandidate
    }
  }

  return null
}

function extractMarkdownDestination(rawValue) {
  const trimmed = rawValue.trim()
  if (trimmed.startsWith("<")) {
    const closingIndex = trimmed.indexOf(">")
    if (closingIndex > 0) {
      return trimmed.slice(1, closingIndex)
    }
  }

  return trimmed.split(/\s+/u)[0] ?? ""
}

function normalizeLinkedTarget(rawValue) {
  let value = rawValue.trim()
  if (!value || value.startsWith("#")) {
    return null
  }

  value = value.replace(/^!/, "")
  value = value.split("|")[0]?.trim() ?? ""
  value = value.split("#")[0]?.trim() ?? ""
  value = value.split("?")[0]?.trim() ?? ""
  value = toPosix(value)

  if (!value || /^[a-z][a-z0-9+.-]*:/iu.test(value)) {
    return null
  }

  return value
}

async function extractNoteTitle(sourcePath, fallbackPath) {
  const content = await fs.readFile(sourcePath, "utf8")
  const lines = content.split(/\r?\n/u)
  let inFrontmatter = false

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim()
    if (index === 0 && line === "---") {
      inFrontmatter = true
      continue
    }

    if (inFrontmatter) {
      if (line === "---") {
        inFrontmatter = false
      }
      continue
    }

    if (line.startsWith("#")) {
      return line.replace(/^#+\s*/u, "").trim()
    }

    if (line.length > 0) {
      return line.slice(0, 60)
    }
  }

  return path.posix.basename(fallbackPath, path.posix.extname(fallbackPath))
}

async function filesAreEqual(leftPath, rightPath) {
  const [leftStat, rightStat] = await Promise.all([fs.stat(leftPath), fs.stat(rightPath)])
  if (leftStat.size !== rightStat.size) {
    return false
  }

  const [leftBuffer, rightBuffer] = await Promise.all([
    fs.readFile(leftPath),
    fs.readFile(rightPath),
  ])

  return leftBuffer.equals(rightBuffer)
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function ensureDirectory(directoryPath) {
  await fs.mkdir(directoryPath, { recursive: true })
}

async function assertDirectoryExists(directoryPath, label) {
  try {
    const stat = await fs.stat(directoryPath)
    if (!stat.isDirectory()) {
      throw new Error(`${label} 不是目录：${displayPath(directoryPath)}`)
    }
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      throw new Error(`${label} 不存在：${displayPath(directoryPath)}`)
    }
    throw error
  }
}

function resolvePath(inputPath) {
  return path.isAbsolute(inputPath) ? path.normalize(inputPath) : path.resolve(cwd, inputPath)
}

function normalizeGlobPatterns(patterns) {
  return patterns.map((pattern) => toPosix(pattern.trim())).filter(Boolean)
}

function normalizeRuleEntries(patterns) {
  return patterns.map((pattern) => parseRuleEntry(pattern)).filter(Boolean)
}

function parseRuleEntry(rule) {
  const trimmed = rule.trim()
  if (trimmed.startsWith("glob:")) {
    return createGlobRuleEntry(trimmed.slice("glob:".length).trim())
  }

  return createLiteralRuleEntry(trimmed)
}

function createLiteralRuleEntry(value) {
  const normalizedValue = toPosix(value.trim())
  return {
    kind: "literal",
    value: normalizedValue,
    pattern: convertPathToPattern(normalizedValue),
  }
}

function createGlobRuleEntry(value) {
  const normalizedValue = toPosix(value.trim())
  return {
    kind: "glob",
    value: normalizedValue,
    pattern: normalizedValue,
  }
}

function assertInside(rootPath, candidatePath, label) {
  if (!isInside(rootPath, candidatePath)) {
    throw new Error(`${label} 路径越界：${displayPath(candidatePath)}`)
  }
}

function isInside(rootPath, candidatePath) {
  const relativePath = path.relative(rootPath, candidatePath)
  return !(relativePath.startsWith("..") || path.isAbsolute(relativePath))
}

function toPosix(value) {
  return value.replaceAll("\\", "/")
}

function displayPath(filePath) {
  return toPosix(path.relative(cwd, filePath) || filePath)
}

function isInteractiveTerminal() {
  return Boolean(input.isTTY && output.isTTY)
}
