"use client"

import Link from "next/link"
import { ChevronRight, FileText, Folder, Search } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import type { NoteSearchRecord, NoteSection, NoteTreeNode } from "@/lib/notes/types"

type SearchDocument = NoteSearchRecord & { id: number }
type SearchIndex = {
  add(document: SearchDocument): unknown
  search(query: string, options: { limit: number }): Array<{ result: Array<number | string> }>
}

function containsPath(node: NoteTreeNode, currentPath: string) {
  return node.path === currentPath || currentPath.startsWith(`${node.path}/`)
}

function ExplorerFolder({ node, currentPath }: { node: NoteTreeNode; currentPath: string }) {
  const containsCurrent = containsPath(node, currentPath)
  const [open, setOpen] = useState(containsCurrent)

  return (
    <li>
      <details
        open={open}
        onToggle={(event) => setOpen(event.currentTarget.open)}
        className="group/folder"
      >
        <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] font-semibold text-[#463f35] transition-colors hover:bg-[#3d5a80]/10 dark:text-[#d3d8e0] dark:hover:bg-[#9ab5d8]/10 [&::-webkit-details-marker]:hidden">
          <ChevronRight
            className="h-3.5 w-3.5 shrink-0 transition-transform group-open/folder:rotate-90"
            aria-hidden="true"
          />
          <Folder
            className="h-3.5 w-3.5 shrink-0 text-[#8f8578] dark:text-[#7f8998]"
            aria-hidden="true"
          />
          <span className="truncate">{node.title}</span>
        </summary>
        <ul className="ml-[0.9rem] border-l border-[#c7beb0] pl-2 dark:border-[#343a44]">
          {node.children?.map((child) => (
            <ExplorerNode
              key={`${child.type}-${child.path}-${currentPath}`}
              node={child}
              currentPath={currentPath}
            />
          ))}
        </ul>
      </details>
    </li>
  )
}

function ExplorerNode({ node, currentPath }: { node: NoteTreeNode; currentPath: string }) {
  if (node.type === "folder") {
    return <ExplorerFolder node={node} currentPath={currentPath} />
  }

  const active = node.path === currentPath
  return (
    <li>
      <Link
        href={node.path}
        aria-current={active ? "page" : undefined}
        className={`flex items-start gap-1.5 rounded-md px-2 py-1.5 text-[13px] leading-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3d5a80] dark:focus-visible:ring-[#9ab5d8] ${
          active
            ? "bg-[#3d5a80]/12 font-bold text-[#2f4d70] dark:bg-[#9ab5d8]/15 dark:text-[#b8cbea]"
            : "text-[#665d52] hover:bg-[#3d5a80]/8 hover:text-[#2f4d70] dark:text-[#aeb5c0] dark:hover:bg-[#9ab5d8]/10 dark:hover:text-[#dbe7f6]"
        }`}
      >
        <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden="true" />
        <span>{node.title}</span>
      </Link>
    </li>
  )
}

function ExplorerPanel({
  section,
  tree,
  currentPath,
  idPrefix,
}: {
  section: NoteSection
  tree: NoteTreeNode[]
  currentPath: string
  idPrefix: string
}) {
  const sectionTitle = section === "blog" ? "笔记" : "杂谈"
  const [query, setQuery] = useState("")
  const [records, setRecords] = useState<NoteSearchRecord[]>([])
  const [results, setResults] = useState<NoteSearchRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const indexRef = useRef<SearchIndex | null>(null)
  const loadingRef = useRef<Promise<void> | null>(null)
  const recordsRef = useRef<NoteSearchRecord[]>([])

  const ensureSearch = useCallback(async () => {
    if (indexRef.current) return
    if (loadingRef.current) return loadingRef.current

    setLoading(true)
    setLoadError(false)
    loadingRef.current = Promise.all([
      import("flexsearch"),
      fetch(`/quartz-assets/search/${section}.json`).then((response) => {
        if (!response.ok) throw new Error(`Search data returned ${response.status}`)
        return response.json() as Promise<NoteSearchRecord[]>
      }),
    ])
      .then(([module, searchRecords]) => {
        const FlexSearch = module.default
        const index = new FlexSearch.Document<SearchDocument>({
          document: {
            id: "id",
            index: [
              { field: "title", tokenize: "full" },
              { field: "text", tokenize: "forward" },
              { field: "tags", tokenize: "full" },
            ],
          },
        }) as SearchIndex

        searchRecords.forEach((record, id) => index.add({ ...record, id }))
        recordsRef.current = searchRecords
        setRecords(searchRecords)
        indexRef.current = index
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))

    return loadingRef.current
  }, [section])

  const runSearch = useCallback((value: string) => {
    const normalized = value.trim().toLocaleLowerCase("zh-CN")
    if (!normalized || !indexRef.current) {
      setResults([])
      return
    }

    const directMatches = recordsRef.current.filter((record) =>
      `${record.title} ${record.tags.join(" ")}`.toLocaleLowerCase("zh-CN").includes(normalized),
    )
    const ids = indexRef.current
      .search(normalized, { limit: 10 })
      .flatMap((group) => group.result)
      .map(Number)
      .filter(Number.isInteger)
    const indexedMatches = ids.map((id) => recordsRef.current[id]).filter(Boolean)
    setResults(
      [...directMatches, ...indexedMatches]
        .filter(
          (record, index, all) => all.findIndex((item) => item.route === record.route) === index,
        )
        .slice(0, 10),
    )
  }, [])

  async function handleQuery(value: string) {
    setQuery(value)
    await ensureSearch()
    runSearch(value)
  }

  useEffect(() => {
    if (query) runSearch(query)
  }, [query, records, runSearch])

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold tracking-[0.22em] text-[#8f8578] dark:text-[#7f8998]">
            EXPLORE
          </p>
          <h2 className="mt-1 font-serif text-base font-bold text-[#2b251d] dark:text-[#f2f4f7]">
            {sectionTitle}目录
          </h2>
        </div>
        <span className="text-[11px] text-[#8f8578] dark:text-[#7f8998]">
          {records.length || ""}
        </span>
      </div>

      <label className="relative mt-4 block" htmlFor={`${idPrefix}-note-search`}>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f8578] dark:text-[#7f8998]"
          aria-hidden="true"
        />
        <span className="sr-only">搜索当前{sectionTitle}</span>
        <input
          id={`${idPrefix}-note-search`}
          type="search"
          value={query}
          onFocus={() => void ensureSearch()}
          onChange={(event) => void handleQuery(event.target.value)}
          placeholder={`搜索${sectionTitle}`}
          autoComplete="off"
          className="h-10 w-full rounded-lg border border-[#c7beb0] bg-[#ebe5dc] pl-9 pr-3 text-sm text-[#2b251d] outline-none transition-colors placeholder:text-[#8f8578] focus:border-[#3d5a80] focus:ring-2 focus:ring-[#3d5a80]/20 dark:border-[#343a44] dark:bg-[#111317] dark:text-[#f2f4f7] dark:placeholder:text-[#7f8998] dark:focus:border-[#9ab5d8] dark:focus:ring-[#9ab5d8]/20"
        />
      </label>

      <div className="mt-3 max-h-[calc(100vh-15rem)] overflow-y-auto overscroll-contain pr-1 [scrollbar-color:#8f8578_transparent] [scrollbar-width:thin]">
        {loadError ? (
          <p className="rounded-lg border border-[#c7beb0] px-3 py-2 text-xs leading-5 text-[#665d52] dark:border-[#343a44] dark:text-[#aeb5c0]">
            搜索暂时不可用，目录仍可正常浏览。
          </p>
        ) : query ? (
          loading ? (
            <p className="px-2 py-2 text-xs text-[#8f8578] dark:text-[#7f8998]">正在载入索引…</p>
          ) : results.length > 0 ? (
            <ul className="space-y-1" aria-label={`${sectionTitle}搜索结果`}>
              {results.map((result) => (
                <li key={result.route}>
                  <Link
                    href={result.route}
                    className="block rounded-lg border border-transparent px-2.5 py-2 text-sm text-[#463f35] transition-colors hover:border-[#c7beb0] hover:bg-[#ebe5dc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3d5a80] dark:text-[#d3d8e0] dark:hover:border-[#343a44] dark:hover:bg-[#111317] dark:focus-visible:ring-[#9ab5d8]"
                  >
                    <span className="block font-bold leading-5">{result.title}</span>
                    {result.tags.length > 0 && (
                      <span className="mt-1 block truncate text-[11px] text-[#8f8578] dark:text-[#7f8998]">
                        {result.tags.join(" · ")}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-2 py-2 text-xs text-[#8f8578] dark:text-[#7f8998]">没有匹配的笔记。</p>
          )
        ) : (
          <ul className="space-y-0.5" aria-label={`${sectionTitle}目录树`}>
            {tree.map((node) => (
              <ExplorerNode
                key={`${node.type}-${node.path}-${currentPath}`}
                node={node}
                currentPath={currentPath}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default function NoteExplorer({
  section,
  tree,
  currentPath,
}: {
  section: NoteSection
  tree: NoteTreeNode[]
  currentPath: string
}) {
  return (
    <>
      <aside className="hidden lg:block" aria-label="笔记探索栏">
        <div
          data-field-obstacle
          className="sticky top-24 rounded-2xl border border-[#c7beb0] bg-[#f3f0ea] p-4 shadow-[0_14px_38px_-28px_rgba(43,37,29,0.55)] dark:border-[#343a44] dark:bg-[#1a1c20]"
        >
          <ExplorerPanel
            section={section}
            tree={tree}
            currentPath={currentPath}
            idPrefix="desktop"
          />
        </div>
      </aside>

      <details
        data-field-obstacle
        className="rounded-xl border border-[#c7beb0] bg-[#f3f0ea] p-4 shadow-sm lg:hidden dark:border-[#343a44] dark:bg-[#1a1c20]"
      >
        <summary className="cursor-pointer font-bold text-[#2b251d] dark:text-[#f2f4f7]">
          探索笔记
        </summary>
        <div className="mt-4 border-t border-[#ddd5c9] pt-4 dark:border-[#343a44]">
          <ExplorerPanel
            section={section}
            tree={tree}
            currentPath={currentPath}
            idPrefix="mobile"
          />
        </div>
      </details>
    </>
  )
}
