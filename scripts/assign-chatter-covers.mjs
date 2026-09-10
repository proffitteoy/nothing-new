#!/usr/bin/env node

import { createHash, randomInt } from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { globby } from "globby"

const imageExtension = /\.(?:avif|gif|jpe?g|png|webp)$/iu
const frontmatterPattern = /^(?:\uFEFF)?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u
const coverFieldPattern = /^(?:cover|image|socialImage)\s*:[^\r\n]*(?:\r?\n|$)/gmu

export async function assignChatterCovers({
  rootDir = process.cwd(),
  dryRun = false,
  check = false,
  randomIndex = (length) => randomInt(length),
} = {}) {
  const contentRoot = path.resolve(rootDir, "content")
  const chatterRoot = path.join(contentRoot, "misc")
  const coverRoot = path.resolve(rootDir, "public", "chatter-covers")
  const notePaths = await globby("**/*.md", {
    absolute: true,
    cwd: chatterRoot,
    onlyFiles: true,
  })
  const contentImages = await collectContentImages(contentRoot)
  const coverPool = await collectCoverPool(coverRoot)

  if (coverPool.length === 0) {
    throw new Error("封面目录中没有可用图片：" + displayPath(rootDir, coverRoot))
  }

  const notes = []
  for (const notePath of notePaths.sort((left, right) => left.localeCompare(right, "zh-CN"))) {
    const content = await fs.readFile(notePath, "utf8")
    const firstImage = findFirstImageReference(content)
    const articleCover = firstImage
      ? resolveArticleCover(firstImage, notePath, contentRoot, contentImages)
      : null
    notes.push({
      content,
      notePath,
      articleCover,
      currentCover: extractCover(content),
    })
  }

  const fallbackNotes = notes.filter((note) => !note.articleCover)
  const fallbackCovers = assignFallbackCovers(fallbackNotes, coverPool, randomIndex)
  let fallbackIndex = 0
  const assignments = notes.map((note) => ({
    ...note,
    cover: note.articleCover ?? fallbackCovers[fallbackIndex++],
    source: note.articleCover
      ? "正文首图"
      : note.currentCover === fallbackCovers[fallbackIndex - 1]
        ? "已有分配"
        : "封面目录",
  }))

  if (check) {
    return checkAssignments(assignments, rootDir, coverPool)
  }

  let changedCount = 0
  for (const assignment of assignments) {
    const nextContent = upsertCover(assignment.content, assignment.cover)
    const changed = nextContent !== assignment.content
    if (changed) changedCount += 1
    const action = changed ? (dryRun ? "将更新" : "已更新") : "未变化"
    console.log(
      "[chatter-covers] " +
        action +
        ": " +
        displayPath(rootDir, assignment.notePath) +
        " -> " +
        assignment.cover +
        "（" +
        assignment.source +
        "）",
    )
    if (changed && !dryRun) {
      await fs.writeFile(assignment.notePath, nextContent, "utf8")
    }
  }

  console.log(
    "[chatter-covers] " +
      (dryRun ? "dry-run" : "完成") +
      ": 文章 " +
      assignments.length +
      "，正文首图 " +
      (assignments.length - fallbackNotes.length) +
      "，目录分配 " +
      fallbackNotes.length +
      "，实际写入 " +
      (dryRun ? 0 : changedCount),
  )

  return {
    articleImageCount: assignments.length - fallbackNotes.length,
    assignmentCount: assignments.length,
    changedCount,
    fallbackCount: fallbackNotes.length,
  }
}

async function collectContentImages(contentRoot) {
  const files = await globby("**/*", {
    absolute: true,
    cwd: contentRoot,
    onlyFiles: true,
  })
  const images = files.filter((filePath) => imageExtension.test(filePath))
  const byRelativePath = new Map()
  const byBaseName = new Map()

  for (const imagePath of images) {
    const relativePath = toPosix(path.relative(contentRoot, imagePath))
    byRelativePath.set(relativePath.toLocaleLowerCase("zh-CN"), imagePath)
    const baseName = path.basename(imagePath).toLocaleLowerCase("zh-CN")
    const matches = byBaseName.get(baseName) ?? []
    matches.push(imagePath)
    byBaseName.set(baseName, matches)
  }

  return { byBaseName, byRelativePath }
}

async function collectCoverPool(coverRoot) {
  const files = await globby("**/*", {
    absolute: true,
    cwd: coverRoot,
    onlyFiles: true,
  })
  const uniqueHashes = new Set()
  const covers = []

  for (const filePath of files.sort((left, right) => left.localeCompare(right, "zh-CN"))) {
    if (!imageExtension.test(filePath)) continue
    const hash = createHash("sha256")
      .update(await fs.readFile(filePath))
      .digest("hex")
    if (uniqueHashes.has(hash)) continue
    uniqueHashes.add(hash)
    covers.push("/chatter-covers/" + toPosix(path.relative(coverRoot, filePath)))
  }

  return covers
}

export function findFirstImageReference(content) {
  const frontmatter = content.match(frontmatterPattern)
  const body = frontmatter ? content.slice(frontmatter[0].length) : content
  const candidates = []
  const wikiImagePattern = /!\[\[([^\]]+?)\]\]/gu
  const markdownImagePattern =
    /!\[[^\]]*\]\(\s*(?:<([^>\r\n]+)>|([^\s)]+))(?:\s+["'][^\r\n]*?["'])?\s*\)/gu

  for (const match of body.matchAll(wikiImagePattern)) {
    const target = cleanImageTarget(match[1].split("|", 1)[0])
    if (isImageTarget(target)) {
      candidates.push({ index: match.index, kind: "wiki", target })
    }
  }

  for (const match of body.matchAll(markdownImagePattern)) {
    const target = cleanImageTarget(match[1] ?? match[2])
    if (isImageTarget(target)) {
      candidates.push({ index: match.index, kind: "markdown", target })
    }
  }

  candidates.sort((left, right) => left.index - right.index)
  return candidates[0] ?? null
}

function cleanImageTarget(rawTarget) {
  const withoutAnchor = rawTarget.trim().split("#", 1)[0]
  try {
    return decodeURIComponent(withoutAnchor)
  } catch {
    return withoutAnchor
  }
}

function isImageTarget(target) {
  const pathname = target.split(/[?#]/u, 1)[0]
  return imageExtension.test(pathname)
}

function resolveArticleCover(reference, notePath, contentRoot, contentImages) {
  if (/^(?:https?:)?\/\//iu.test(reference.target) || reference.target.startsWith("/")) {
    return reference.target
  }

  const target = toPosix(reference.target).replace(/^\.\/+/u, "")
  const relativeTarget = target.toLocaleLowerCase("zh-CN")
  const noteRelativeDir = toPosix(path.relative(contentRoot, path.dirname(notePath)))
  const noteRelativeTarget = path.posix.normalize(path.posix.join(noteRelativeDir, target))
  const candidates =
    reference.kind === "wiki"
      ? [
          contentImages.byRelativePath.get(relativeTarget),
          contentImages.byRelativePath.get(noteRelativeTarget.toLocaleLowerCase("zh-CN")),
        ]
      : [
          contentImages.byRelativePath.get(noteRelativeTarget.toLocaleLowerCase("zh-CN")),
          contentImages.byRelativePath.get(relativeTarget),
        ]
  const baseNameMatches =
    contentImages.byBaseName.get(path.posix.basename(target).toLocaleLowerCase("zh-CN")) ?? []
  const resolvedPath = candidates.find(Boolean) ?? baseNameMatches[0]

  if (!resolvedPath) return null

  return toPosix(path.relative(path.dirname(notePath), resolvedPath))
}

export function distributeCovers(count, coverPool, randomIndex) {
  if (count === 0) return []
  if (coverPool.length === 0) throw new Error("封面池不能为空")

  const result = []
  while (result.length < count) {
    const cycle = shuffle([...coverPool], randomIndex)
    const previous = result.at(-1)
    if (cycle.length > 1 && cycle[0] === previous) {
      ;[cycle[0], cycle[1]] = [cycle[1], cycle[0]]
    }
    result.push(...cycle.slice(0, count - result.length))
  }
  return result
}

export function assignFallbackCovers(notes, coverPool, randomIndex) {
  if (coverPool.length === 0) throw new Error("封面池不能为空")

  const allowedCovers = new Set(coverPool)
  const unusedCovers = new Set(coverPool)
  const assignments = new Array(notes.length)
  const pendingIndexes = []

  for (const [index, note] of notes.entries()) {
    const currentCover = note.currentCover
    if (currentCover && allowedCovers.has(currentCover) && unusedCovers.has(currentCover)) {
      assignments[index] = currentCover
      unusedCovers.delete(currentCover)
    } else {
      pendingIndexes.push(index)
    }
  }

  const shuffledUnusedCovers = shuffle([...unusedCovers], randomIndex)
  const reuseCount = pendingIndexes
    .slice(shuffledUnusedCovers.length)
    .filter((index) => !allowedCovers.has(notes[index].currentCover)).length
  const reusedCovers = distributeCovers(reuseCount, coverPool, randomIndex)

  for (const index of pendingIndexes) {
    const unusedCover = shuffledUnusedCovers.shift()
    if (unusedCover) {
      assignments[index] = unusedCover
      continue
    }

    const currentCover = notes[index].currentCover
    assignments[index] = allowedCovers.has(currentCover) ? currentCover : reusedCovers.shift()
  }

  return assignments
}

function shuffle(values, randomIndex) {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1)
    ;[values[index], values[swapIndex]] = [values[swapIndex], values[index]]
  }
  return values
}

export function upsertCover(content, cover) {
  const lineEnding = content.includes("\r\n") ? "\r\n" : "\n"
  const normalized = content.replace(/^\uFEFF/u, "")
  const frontmatter = normalized.match(frontmatterPattern)
  const coverLine = "cover: " + JSON.stringify(cover)

  if (!frontmatter) {
    return ["---", coverLine, "---", "", normalized].join(lineEnding)
  }

  const body = normalized.slice(frontmatter[0].length)
  const fieldsWithoutCover = frontmatter[1]
    .replace(coverFieldPattern, "")
    .replace(/(?:\r?\n){2,}/gu, lineEnding)
    .replace(/(?:\r?\n)+$/u, "")
  const nextFields = fieldsWithoutCover ? coverLine + lineEnding + fieldsWithoutCover : coverLine
  return ["---", nextFields, "---", body].join(lineEnding)
}

function extractCover(content) {
  const frontmatter = content.match(frontmatterPattern)
  if (!frontmatter) return null
  const match = frontmatter[1].match(/^(?:cover|image|socialImage)\s*:\s*(.+?)\s*$/mu)
  if (!match) return null
  const value = match[1].trim()
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }
  return value
}

function checkAssignments(assignments, rootDir, coverPool) {
  const errors = []
  const fallbackCovers = []
  const allowedFallbackCovers = new Set(coverPool)

  for (const assignment of assignments) {
    const currentCover = extractCover(assignment.content)
    if (!currentCover) {
      errors.push(displayPath(rootDir, assignment.notePath) + " 缺少 cover")
      continue
    }
    if (assignment.articleCover && currentCover !== assignment.articleCover) {
      errors.push(
        displayPath(rootDir, assignment.notePath) +
          " 未使用正文首图（当前 " +
          currentCover +
          "，应为 " +
          assignment.articleCover +
          "）",
      )
    }
    if (!assignment.articleCover) {
      fallbackCovers.push(currentCover)
      if (!allowedFallbackCovers.has(currentCover)) {
        errors.push(
          displayPath(rootDir, assignment.notePath) +
            " 的 cover 不在 public/chatter-covers/ 图片池中",
        )
      }
    }
  }

  if (new Set(fallbackCovers).size < Math.min(fallbackCovers.length, coverPool.length)) {
    errors.push("仍有可以用未占用图片消除的重复目录封面")
  }

  if (errors.length > 0) {
    for (const error of errors) console.error("[chatter-covers] " + error)
    process.exitCode = 1
  } else {
    console.log(
      "[chatter-covers] check: 文章 " + assignments.length + "，正文首图和目录分配均符合规则",
    )
  }

  return { assignmentCount: assignments.length, errors }
}

function displayPath(rootDir, filePath) {
  return toPosix(path.relative(rootDir, filePath))
}

function toPosix(value) {
  return value.replaceAll(path.sep, "/")
}

const directRun =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))

if (directRun) {
  const args = new Set(process.argv.slice(2))
  await assignChatterCovers({
    check: args.has("--check"),
    dryRun: args.has("--dry-run"),
  })
}
