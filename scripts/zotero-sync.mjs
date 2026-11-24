import fs from "node:fs/promises"
import path from "node:path"
import readline from "node:readline/promises"
import { stdin, stdout } from "node:process"
import { pathToFileURL } from "node:url"

const plain = (value) =>
  String(value ?? "")
    .replace(/<[^>]*>/g, "")
    .trim()

export function publicPaper(item, config, collections) {
  const data = item.data
  if (!data || typeof data.itemType !== "string") throw new Error("Invalid Zotero item")
  if (["note", "attachment", "annotation"].includes(data.itemType) || data.deleted) return null
  if (!/^[A-Z0-9]{8}$/.test(item.key) || !plain(data.title)) {
    throw new Error("Zotero item is missing a key or title")
  }
  const namespace =
    config.libraryPath === "users/0" ? "personal" : config.libraryPath.replace("/", ":")
  const id = `zotero:${namespace}:${item.key}`
  const tags = new Set((data.tags ?? []).map((entry) => entry.tag))
  const doi =
    plain(data.DOI)
      .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
      .toLowerCase() || null
  const arxiv =
    /(?:arxiv(?:\.org\/(?:abs|pdf)\/|\s*:\s*)|^)(\d{4}\.\d{4,5}|[a-z-]+(?:\.[a-z-]+)?\/\d{7})(?:v\d+)?/i
      .exec(`${data.url ?? ""}\n${data.extra ?? ""}`)?.[1]
      ?.toLowerCase() ?? null
  let url = null
  try {
    const parsed = new URL(data.url)
    if (["https:", "http:"].includes(parsed.protocol)) url = parsed.href
  } catch {
    /* A bibliographic URL is optional. */
  }
  return {
    id,
    aliases:
      item.library?.id && item.library?.type
        ? [
            `zotero:${item.library.type === "user" ? "users" : "groups"}:${item.library.id}:${item.key}`,
          ]
        : [],
    title: plain(data.title),
    authors: (data.creators ?? [])
      .filter((creator) => ["author", "editor", "bookAuthor"].includes(creator.creatorType))
      .map((creator) =>
        plain(creator.name || [creator.firstName, creator.lastName].filter(Boolean).join(" ")),
      ),
    year: /\b(?:18|19|20)\d{2}\b/.exec(data.date ?? "")?.[0] ?? "",
    doi,
    arxiv,
    url: url ?? (doi ? `https://doi.org/${doi}` : arxiv ? `https://arxiv.org/abs/${arxiv}` : null),
    abstract: plain(data.abstractNote),
    collections: collections.map((collection) => ({
      id: collection.key,
      name: collection.name,
      parentId: collection.parent || null,
    })),
    readingStatus: tags.has(config.readTag ?? "paper:read")
      ? "read"
      : tags.has(config.readingTag ?? "paper:reading")
        ? "reading"
        : null,
    updatedAt: data.dateModified ?? "",
  }
}

export async function syncZotero(config, options = {}) {
  if (!/^(users|groups)\/\d+$/.test(config.libraryPath)) throw new Error("Invalid libraryPath")
  if (!config.collections?.length)
    throw new Error("No Collections approved; previous snapshot retained")
  const base = new URL(config.apiUrl ?? "http://127.0.0.1:23119")
  if (!["127.0.0.1", "localhost", "[::1]"].includes(base.hostname)) {
    throw new Error("Zotero sync must use the local desktop API")
  }
  const request = options.fetch ?? fetch
  async function all(endpoint) {
    const items = []
    const seen = new Set()
    let expectedTotal
    for (let start = 0; start < 100_000; start += 100) {
      const url = new URL(`/api/${config.libraryPath}/${endpoint}`, base)
      url.search = new URLSearchParams({
        format: "json",
        limit: "100",
        start: String(start),
      }).toString()
      const response = await request(url, {
        signal: AbortSignal.timeout(20_000),
        headers: { "Zotero-API-Version": "3" },
      })
      if (!response.ok)
        throw new Error(`Zotero API returned ${response.status}; previous snapshot retained`)
      const page = await response.json()
      if (!Array.isArray(page))
        throw new Error("Invalid Zotero response; previous snapshot retained")
      const total = response.headers.get("Total-Results")
      if (total !== null) {
        if (!/^\d+$/.test(total)) throw new Error("Invalid Zotero pagination")
        if (expectedTotal !== undefined && expectedTotal !== Number(total))
          throw new Error("Library changed during sync; retry")
        expectedTotal = Number(total)
      }
      for (const entry of page) {
        if (!entry?.key || seen.has(entry.key)) throw new Error("Invalid or repeated Zotero page")
        seen.add(entry.key)
        items.push(entry)
      }
      if (page.length < 100 || items.length === expectedTotal) {
        if (expectedTotal !== undefined && items.length !== expectedTotal)
          throw new Error("Incomplete Zotero response")
        return items
      }
    }
    throw new Error("Zotero pagination exceeded limit")
  }

  const rawCollections = await all("collections")
  const collectionMap = new Map(
    rawCollections.map((entry) => {
      if (!entry.data?.name) throw new Error("Invalid Zotero Collection")
      return [
        entry.key,
        { key: entry.key, name: entry.data.name, parent: entry.data.parentCollection },
      ]
    }),
  )
  const selected = new Set()
  for (const approved of config.collections) {
    if (!collectionMap.has(approved.key))
      throw new Error(`Approved Collection ${approved.key} not found; previous snapshot retained`)
    selected.add(approved.key)
    if (approved.includeChildren) {
      for (const collection of collectionMap.values()) {
        const visited = new Set()
        let current = collection
        while (current?.parent && !visited.has(current.key)) {
          visited.add(current.key)
          if (current.parent === approved.key) {
            selected.add(collection.key)
            break
          }
          current = collectionMap.get(current.parent)
        }
      }
    }
  }
  const candidates = new Map()
  for (const key of selected) {
    const collection = collectionMap.get(key)
    if (!selected.has(collection.parent)) collection.parent = null
  }
  // Fetch only approved Collections, never the entire library or child notes.
  for (const key of selected) {
    for (const item of await all(`collections/${key}/items/top`)) {
      const existing = candidates.get(item.key)
      if (existing) {
        if (existing.item.version !== item.version)
          throw new Error("Item changed during sync; retry")
        existing.collections.push(collectionMap.get(key))
      } else candidates.set(item.key, { item, collections: [collectionMap.get(key)] })
    }
  }
  if (config.includeUnfiled) {
    const unfiled = { key: "unfiled", name: "未分类", parent: null }
    collectionMap.set(unfiled.key, unfiled)
    selected.add(unfiled.key)
    for (const item of await all("items/top")) {
      if (
        !(item.data?.collections ?? []).some((key) => collectionMap.has(key)) &&
        !candidates.has(item.key)
      ) {
        candidates.set(item.key, { item, collections: [unfiled] })
      }
    }
  }
  const outputFile = path.resolve(config.outputFile ?? "data/paper-library.json")
  let previous = null
  try {
    previous = JSON.parse(await fs.readFile(outputFile, "utf8"))
  } catch (error) {
    if (error.code !== "ENOENT") throw error
  }
  const decisionFile = path.resolve(config.decisionFile ?? ".sync/zotero-sync-decisions.json")
  let decisions = { include: [], exclude: [] }
  try {
    decisions = JSON.parse(await fs.readFile(decisionFile, "utf8"))
  } catch (error) {
    if (error.code !== "ENOENT") throw error
  }
  const excluded = new Set([...(config.exclude ?? []), ...decisions.exclude])
  const approved = new Set([...(config.approvedItems ?? []), ...decisions.include])
  const allPapers = [...candidates.values()]
    .map(({ item, collections }) => publicPaper(item, config, collections))
    .filter(Boolean)
  if (options.review) {
    if (options.dryRun || options.check) throw new Error("Review cannot run with dry-run/check")
    if (!stdin.isTTY) throw new Error("Review needs an interactive terminal")
    const rl = readline.createInterface({ input: stdin, output: stdout })
    try {
      for (const paper of allPapers.filter(
        (entry) => !approved.has(entry.id) && !excluded.has(entry.id),
      )) {
        const answer = (await rl.question(`${paper.title}\n${paper.id} 公开元数据？[y/n/s/q] `))
          .trim()
          .toLowerCase()
        if (answer === "q") break
        if (answer === "y") {
          approved.add(paper.id)
          decisions.include.push(paper.id)
        }
        if (answer === "n") {
          excluded.add(paper.id)
          decisions.exclude.push(paper.id)
        }
      }
    } finally {
      rl.close()
    }
    await fs.mkdir(path.dirname(decisionFile), { recursive: true })
    await fs.writeFile(decisionFile, `${JSON.stringify(decisions, null, 2)}\n`)
  }
  const papers = allPapers
    .filter(
      (paper) =>
        !excluded.has(paper.id) && (config.reviewMode !== "items" || approved.has(paper.id)),
    )
    .sort((a, b) => a.id.localeCompare(b.id))
  if (previous?.papers?.length && !papers.length && !options.allowEmpty) {
    throw new Error(
      "Refusing to replace a nonempty snapshot with an empty one; use --allow-empty after review",
    )
  }
  const collections = [...selected].map((key) => {
    const collection = collectionMap.get(key)
    return { id: key, name: collection.name, parentId: collection.parent || null }
  })
  const changed =
    JSON.stringify(previous?.papers) !== JSON.stringify(papers) ||
    JSON.stringify(previous?.collections) !== JSON.stringify(collections)
  if (!options.dryRun && !options.check && changed) {
    const snapshot = { version: 1, syncedAt: new Date().toISOString(), collections, papers }
    await fs.mkdir(path.dirname(outputFile), { recursive: true })
    const temporary = `${outputFile}.${process.pid}.tmp`
    try {
      await fs.writeFile(temporary, `${JSON.stringify(snapshot, null, 2)}\n`, { flag: "wx" })
      await fs.rename(temporary, outputFile)
    } finally {
      await fs.rm(temporary, { force: true })
    }
  }
  return {
    papers: papers.length,
    pending: allPapers.filter((paper) => !excluded.has(paper.id) && !approved.has(paper.id)).length,
    changed,
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2)
  const configIndex = args.indexOf("--config")
  try {
    const { default: config } = await import(
      pathToFileURL(
        path.resolve(configIndex === -1 ? "zotero-sync.config.mjs" : args[configIndex + 1]),
      ).href
    )
    const result = await syncZotero(config, {
      dryRun: args.includes("--dry-run"),
      check: args.includes("--check"),
      review: args.includes("--review"),
      allowEmpty: args.includes("--allow-empty"),
    })
    console.log(
      `[zotero-sync] ${result.papers} 篇公开论文，${result.changed ? "存在变化" : "已是最新"}${config.reviewMode === "items" ? `，${result.pending} 篇待审阅` : ""}`,
    )
    if (args.includes("--check") && result.changed) process.exitCode = 1
  } catch (error) {
    console.error(`[zotero-sync] ${error.message}`)
    process.exitCode = 1
  }
}
