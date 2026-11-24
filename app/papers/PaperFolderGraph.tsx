"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowUpRight, ChevronRight, Folder, FolderOpen, RotateCcw } from "lucide-react"
import type { LibraryPaper, ZoteroPaper } from "@/lib/paper-library"
import { buildPaperFolderData, folderDescendants } from "./graph/data"
import type { GraphController, KGSelection } from "./graph/types"
import styles from "./PaperLibrary.module.css"

export default function PaperFolderGraph({
  papers,
  collections,
  query,
  onOpen,
}: {
  papers: LibraryPaper[]
  collections: ZoteroPaper["collections"]
  query: string
  onOpen: (paper: LibraryPaper, trigger: HTMLElement) => void
}) {
  const root = useRef<HTMLDivElement>(null)
  const controller = useRef<GraphController | null>(null)
  const open = useRef(onOpen)
  const queryRef = useRef(query)
  const [folder, setFolder] = useState("")
  const [expanded, setExpanded] = useState(new Set<string>())
  const [failed, setFailed] = useState(false)
  const data = useMemo(() => buildPaperFolderData(papers, collections), [papers, collections])
  const keys = useMemo(
    () => (folder ? folderDescendants(collections, folder) : null),
    [collections, folder],
  )
  const search = query.trim().toLowerCase()
  const filtered = papers.filter(
    (paper) =>
      (!keys || paper.collections.some((collection) => keys.has(collection.id))) &&
      (!search ||
        [paper.title, ...paper.authors, paper.doi, paper.arxiv, paper.year]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search)),
  )
  const name = collections.find((collection) => collection.id === folder)?.name ?? "全部文件夹"

  useEffect(() => {
    open.current = onOpen
  }, [onOpen])

  useEffect(() => {
    const element = root.current
    if (!element) return
    let disposed = false
    const select = (event: Event) => {
      const selection = (event as CustomEvent<KGSelection | null>).detail
      if (!selection || selection.node.tier !== "post") setFolder(selection?.node.id.slice(2) ?? "")
      else {
        const paper = papers.find((item) => item.id === selection.node.postId)
        const canvas = element.querySelector("canvas")
        if (paper && canvas) open.current(paper, canvas)
      }
    }
    element.addEventListener("kg:select", select)
    import("./graph/index")
      .then(({ mountKnowledgeGraph }) => {
        if (disposed) return
        controller.current = mountKnowledgeGraph(
          element,
          data,
          {
            loaded: "文件夹关系图已加载",
            failed: "关系图暂不可用",
            tier: { category: "文件夹", tag: "子文件夹", post: "论文", heading: "笔记" },
            posts: "{count} 篇论文",
            sections: "{count} 篇笔记",
            relations: "关联 {count} 个节点",
          },
          (id) => {
            const paper = papers.find((item) => `p:${item.id}` === id)
            const canvas = element.querySelector("canvas")
            if (paper && canvas) open.current(paper, canvas)
          },
        )
        controller.current.patchFilters({
          particles: false,
          showCooccurrence: true,
          minPosts: 0,
          query: queryRef.current,
        })
      })
      .catch(() => {
        if (!disposed) setFailed(true)
      })
    return () => {
      disposed = true
      element.removeEventListener("kg:select", select)
      controller.current?.destroy()
      controller.current = null
    }
  }, [data, papers])

  useEffect(() => {
    queryRef.current = query
    controller.current?.patchFilters({ query })
  }, [query])

  function selectFolder(id: string) {
    setFolder(id)
    controller.current?.select(id ? `c:${id}` : null)
    if (id) setExpanded((previous) => new Set(previous).add(id))
  }

  function renderFolder(
    collection: ZoteroPaper["collections"][number],
    depth = 0,
  ): React.ReactNode {
    const children = collections.filter((item) => item.parentId === collection.id)
    const descendants = folderDescendants(collections, collection.id)
    const count = papers.filter((paper) =>
      paper.collections.some((item) => descendants.has(item.id)),
    ).length
    return (
      <li key={collection.id}>
        <div className={styles.folderRow} style={{ paddingLeft: `${depth * 14}px` }}>
          {children.length ? (
            <button
              type="button"
              className={styles.expandFolder}
              aria-label={`${expanded.has(collection.id) ? "收起" : "展开"}${collection.name}`}
              aria-expanded={expanded.has(collection.id)}
              onClick={() =>
                setExpanded((previous) => {
                  const next = new Set(previous)
                  if (next.has(collection.id)) next.delete(collection.id)
                  else next.add(collection.id)
                  return next
                })
              }
            >
              <ChevronRight
                size={13}
                style={{ transform: expanded.has(collection.id) ? "rotate(90deg)" : undefined }}
                aria-hidden
              />
            </button>
          ) : (
            <span className={styles.folderSpacer} />
          )}
          <button
            type="button"
            className={styles.folderName}
            aria-pressed={folder === collection.id}
            onClick={() => selectFolder(collection.id)}
          >
            {folder === collection.id ? (
              <FolderOpen size={14} aria-hidden />
            ) : (
              <Folder size={14} aria-hidden />
            )}
            <span>{collection.name}</span>
            <small>{count}</small>
          </button>
        </div>
        {expanded.has(collection.id) && children.length > 0 && (
          <ul>{children.map((child) => renderFolder(child, depth + 1))}</ul>
        )}
      </li>
    )
  }

  return (
    <div className={styles.readWorkspace}>
      <div className={styles.graph} ref={root}>
        <div data-kg-surface className={styles.graphSurface}>
          <canvas
            data-kg-canvas
            tabIndex={0}
            role="application"
            aria-label="读过的论文文件夹关系图"
          />
          <p data-kg-status className={styles.graphStatus} role="status">
            {failed ? "关系图暂不可用，可以使用右侧文件夹目录。" : "正在加载文件夹关系图…"}
          </p>
          <div data-kg-tooltip className={styles.graphTooltip} role="tooltip" hidden>
            <strong data-kg-tip-title />
            <span data-kg-tip-meta />
          </div>
        </div>
        <div className={styles.graphControls}>
          <button type="button" onClick={() => controller.current?.resetView()}>
            <RotateCcw size={15} aria-hidden />
            重置视图
          </button>
        </div>
        <div className={styles.graphLegend}>
          <span>● 文件夹</span>
          <span>· 论文</span>
        </div>
      </div>
      <aside className={styles.folderPanel} aria-label="按文件夹浏览已读论文">
        <details className={styles.folderDirectory} open>
          <summary>
            文件夹 <span>{collections.length}</span>
          </summary>
          <div className={styles.folderTree}>
            <button
              type="button"
              className={styles.allFolders}
              aria-pressed={!folder}
              onClick={() => selectFolder("")}
            >
              全部文件夹 <small>{papers.length}</small>
            </button>
            <ul>
              {collections
                .filter(
                  (collection) =>
                    !collection.parentId ||
                    !collections.some((item) => item.id === collection.parentId),
                )
                .map((collection) => renderFolder(collection))}
            </ul>
          </div>
        </details>
        <section className={styles.folderPapers} aria-label="文件夹内论文">
          <header>
            <h2>{name}</h2>
            <span role="status">{filtered.length} 篇</span>
          </header>
          <div className={styles.folderPaperList}>
            {filtered.map((paper) => (
              <button
                key={paper.id}
                type="button"
                aria-haspopup="dialog"
                aria-controls="paper-library-preview"
                onClick={(event) => onOpen(paper, event.currentTarget)}
              >
                <span>{paper.title}</span>
                <small>{[paper.authors.join(" · "), paper.year].filter(Boolean).join(" · ")}</small>
                <ArrowUpRight size={14} aria-hidden />
              </button>
            ))}
            {!filtered.length && <p className={styles.empty}>此文件夹暂无符合条件的已读论文。</p>}
          </div>
        </section>
      </aside>
    </div>
  )
}
