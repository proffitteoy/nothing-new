import { FileTrieNode } from "../../util/fileTrie"
import { FullSlug, resolveRelative, simplifySlug } from "../../util/path"
import { ContentDetails } from "../../plugins/emitters/contentIndex"

type MaybeHTMLElement = HTMLElement | undefined

interface ParsedOptions {
  folderClickBehavior: "collapse" | "link"
  folderDefaultState: "collapsed" | "open"
  useSavedState: boolean
  sortFn: (a: FileTrieNode, b: FileTrieNode) => number
  filterFn: (node: FileTrieNode) => boolean
  mapFn: (node: FileTrieNode) => void
  order: "sort" | "filter" | "map"[]
}

type FolderState = {
  path: string
  collapsed: boolean
}

const MOBILE_BREAKPOINT = "(max-width: 800px)"
const SWIPE_OPEN_EDGE_PX = 28
const SWIPE_TRIGGER_PX = 56
const SWIPE_VERTICAL_TOLERANCE_PX = 48
let currentExplorerState: Array<FolderState>

function isMobileViewport(): boolean {
  return window.matchMedia(MOBILE_BREAKPOINT).matches
}

function setMobileScrollLock(locked: boolean) {
  document.documentElement.classList.toggle("mobile-no-scroll", locked)
}

function isExplorerExpanded(explorer: HTMLElement): boolean {
  return !explorer.classList.contains("collapsed")
}

function setExplorerExpanded(explorer: HTMLElement, expanded: boolean) {
  explorer.classList.toggle("collapsed", !expanded)
  explorer.setAttribute("aria-expanded", expanded ? "true" : "false")

  const explorerContent = explorer.querySelector(".explorer-content") as HTMLElement | null
  if (explorerContent) {
    explorerContent.setAttribute("aria-expanded", expanded ? "true" : "false")
  }

  const backdrop = explorer.querySelector(".explorer-backdrop") as HTMLElement | null
  if (backdrop) {
    const backdropVisible = isMobileViewport() && expanded
    backdrop.classList.toggle("open", backdropVisible)
    backdrop.setAttribute("aria-hidden", backdropVisible ? "false" : "true")
  }

  const toggles = explorer.querySelectorAll(".explorer-toggle") as NodeListOf<HTMLElement>
  for (const toggle of toggles) {
    toggle.setAttribute("aria-expanded", expanded ? "true" : "false")
  }
}

function getExplorerScrollContainer(explorer: Document | HTMLElement): HTMLElement | null {
  return explorer.querySelector(".explorer-content") as HTMLElement | null
}

function closeExplorer(explorer: HTMLElement) {
  setExplorerExpanded(explorer, false)
  setMobileScrollLock(false)
}

function openExplorer(explorer: HTMLElement) {
  setExplorerExpanded(explorer, true)
  setMobileScrollLock(true)
}

function toggleExplorer(this: HTMLElement) {
  const nearestExplorer = this.closest(".explorer") as HTMLElement
  if (!nearestExplorer) return
  const isExpanded = isExplorerExpanded(nearestExplorer)
  const nextExpanded = !isExpanded
  setExplorerExpanded(nearestExplorer, nextExpanded)

  if (this.dataset.mobile === "true") {
    // Stop <html> from being scrollable when mobile explorer is open
    setMobileScrollLock(nextExpanded)
  }
}

function registerMobileSwipeGesture(explorer: HTMLElement) {
  let startX = 0
  let startY = 0
  let deltaX = 0
  let deltaY = 0
  let mode: "open" | "close" | null = null

  const onTouchStart = (event: TouchEvent) => {
    if (!isMobileViewport() || event.touches.length !== 1) return

    const touch = event.touches[0]
    startX = touch.clientX
    startY = touch.clientY
    deltaX = 0
    deltaY = 0
    mode = null

    if (isExplorerExpanded(explorer)) {
      const content = explorer.querySelector(".explorer-content") as HTMLElement | null
      const drawerRight = content?.getBoundingClientRect().right ?? 0
      if (touch.clientX <= drawerRight + 20) {
        mode = "close"
      }
      return
    }

    if (touch.clientX <= SWIPE_OPEN_EDGE_PX) {
      mode = "open"
    }
  }

  const onTouchMove = (event: TouchEvent) => {
    if (!mode || event.touches.length !== 1) return

    const touch = event.touches[0]
    deltaX = touch.clientX - startX
    deltaY = touch.clientY - startY

    if (
      Math.abs(deltaY) > SWIPE_VERTICAL_TOLERANCE_PX &&
      Math.abs(deltaY) > Math.abs(deltaX)
    ) {
      mode = null
      return
    }

    if (Math.abs(deltaX) > Math.abs(deltaY) + 6) {
      event.preventDefault()
    }
  }

  const onTouchEnd = () => {
    if (!mode) return

    if (mode === "open" && deltaX > SWIPE_TRIGGER_PX && Math.abs(deltaY) < SWIPE_VERTICAL_TOLERANCE_PX) {
      openExplorer(explorer)
    } else if (
      mode === "close" &&
      deltaX < -SWIPE_TRIGGER_PX &&
      Math.abs(deltaY) < SWIPE_VERTICAL_TOLERANCE_PX
    ) {
      closeExplorer(explorer)
    }

    mode = null
  }

  document.addEventListener("touchstart", onTouchStart, { passive: true })
  document.addEventListener("touchmove", onTouchMove, { passive: false })
  document.addEventListener("touchend", onTouchEnd, { passive: true })

  window.addCleanup(() => {
    document.removeEventListener("touchstart", onTouchStart)
    document.removeEventListener("touchmove", onTouchMove)
    document.removeEventListener("touchend", onTouchEnd)
  })
}

function toggleFolder(evt: MouseEvent) {
  evt.stopPropagation()
  const target = evt.target as MaybeHTMLElement
  if (!target) return

  // Check if target was svg icon or button
  const isSvg = target.nodeName === "svg"

  // corresponding <ul> element relative to clicked button/folder
  const folderContainer = (
    isSvg
      ? // svg -> div.folder-container
        target.parentElement
      : // button.folder-button -> div -> div.folder-container
        target.parentElement?.parentElement
  ) as MaybeHTMLElement
  if (!folderContainer) return
  const childFolderContainer = folderContainer.nextElementSibling as MaybeHTMLElement
  if (!childFolderContainer) return

  childFolderContainer.classList.toggle("open")

  // Collapse folder container
  const isCollapsed = !childFolderContainer.classList.contains("open")
  setFolderState(childFolderContainer, isCollapsed)

  const currentFolderState = currentExplorerState.find(
    (item) => item.path === folderContainer.dataset.folderpath,
  )
  if (currentFolderState) {
    currentFolderState.collapsed = isCollapsed
  } else {
    currentExplorerState.push({
      path: folderContainer.dataset.folderpath as FullSlug,
      collapsed: isCollapsed,
    })
  }

  const stringifiedFileTree = JSON.stringify(currentExplorerState)
  localStorage.setItem("fileTree", stringifiedFileTree)
}

function createFileNode(currentSlug: FullSlug, node: FileTrieNode): HTMLLIElement {
  const template = document.getElementById("template-file") as HTMLTemplateElement
  const clone = template.content.cloneNode(true) as DocumentFragment
  const li = clone.querySelector("li") as HTMLLIElement
  const a = li.querySelector("a") as HTMLAnchorElement
  a.href = resolveRelative(currentSlug, node.slug)
  a.dataset.for = node.slug
  a.textContent = node.displayName

  if (currentSlug === node.slug) {
    a.classList.add("active")
  }

  return li
}

function createFolderNode(
  currentSlug: FullSlug,
  node: FileTrieNode,
  opts: ParsedOptions,
): HTMLLIElement {
  const template = document.getElementById("template-folder") as HTMLTemplateElement
  const clone = template.content.cloneNode(true) as DocumentFragment
  const li = clone.querySelector("li") as HTMLLIElement
  const folderContainer = li.querySelector(".folder-container") as HTMLElement
  const titleContainer = folderContainer.querySelector("div") as HTMLElement
  const folderOuter = li.querySelector(".folder-outer") as HTMLElement
  const ul = folderOuter.querySelector("ul") as HTMLUListElement

  const folderPath = node.slug
  folderContainer.dataset.folderpath = folderPath

  if (opts.folderClickBehavior === "link") {
    // Replace button with link for link behavior
    const button = titleContainer.querySelector(".folder-button") as HTMLElement
    const a = document.createElement("a")
    a.href = resolveRelative(currentSlug, folderPath)
    a.dataset.for = folderPath
    a.className = "folder-title"
    a.textContent = node.displayName
    button.replaceWith(a)
  } else {
    const span = titleContainer.querySelector(".folder-title") as HTMLElement
    span.textContent = node.displayName
  }

  // if the saved state is collapsed or the default state is collapsed
  const isCollapsed =
    currentExplorerState.find((item) => item.path === folderPath)?.collapsed ??
    opts.folderDefaultState === "collapsed"

  // if this folder is a prefix of the current path we
  // want to open it anyways
  const simpleFolderPath = simplifySlug(folderPath)
  const folderIsPrefixOfCurrentSlug =
    simpleFolderPath === currentSlug.slice(0, simpleFolderPath.length)

  if (!isCollapsed || folderIsPrefixOfCurrentSlug) {
    folderOuter.classList.add("open")
  }

  for (const child of node.children) {
    const childNode = child.isFolder
      ? createFolderNode(currentSlug, child, opts)
      : createFileNode(currentSlug, child)
    ul.appendChild(childNode)
  }

  return li
}

async function setupExplorer(currentSlug: FullSlug) {
  const allExplorers = document.querySelectorAll("div.explorer") as NodeListOf<HTMLElement>

  for (const explorer of allExplorers) {
    const dataFns = JSON.parse(explorer.dataset.dataFns || "{}")
    const opts: ParsedOptions = {
      folderClickBehavior: (explorer.dataset.behavior || "collapse") as "collapse" | "link",
      folderDefaultState: (explorer.dataset.collapsed || "collapsed") as "collapsed" | "open",
      useSavedState: explorer.dataset.savestate === "true",
      order: dataFns.order || ["filter", "map", "sort"],
      sortFn: new Function("return " + (dataFns.sortFn || "undefined"))(),
      filterFn: new Function("return " + (dataFns.filterFn || "undefined"))(),
      mapFn: new Function("return " + (dataFns.mapFn || "undefined"))(),
    }

    // Get folder state from local storage
    const storageTree = localStorage.getItem("fileTree")
    const serializedExplorerState = storageTree && opts.useSavedState ? JSON.parse(storageTree) : []
    const oldIndex = new Map<string, boolean>(
      serializedExplorerState.map((entry: FolderState) => [entry.path, entry.collapsed]),
    )

    const data = await fetchData
    const entries = [...Object.entries(data)] as [FullSlug, ContentDetails][]
    const trie = FileTrieNode.fromEntries(entries)

    // Apply functions in order
    for (const fn of opts.order) {
      switch (fn) {
        case "filter":
          if (opts.filterFn) trie.filter(opts.filterFn)
          break
        case "map":
          if (opts.mapFn) trie.map(opts.mapFn)
          break
        case "sort":
          if (opts.sortFn) trie.sort(opts.sortFn)
          break
      }
    }

    // Get folder paths for state management
    const folderPaths = trie.getFolderPaths()
    currentExplorerState = folderPaths.map((path) => {
      const previousState = oldIndex.get(path)
      return {
        path,
        collapsed:
          previousState === undefined ? opts.folderDefaultState === "collapsed" : previousState,
      }
    })

    const explorerUl = explorer.querySelector(".explorer-ul")
    if (!explorerUl) continue

    // Create and insert new content
    const fragment = document.createDocumentFragment()
    for (const child of trie.children) {
      const node = child.isFolder
        ? createFolderNode(currentSlug, child, opts)
        : createFileNode(currentSlug, child)

      fragment.appendChild(node)
    }
    explorerUl.insertBefore(fragment, explorerUl.firstChild)

    const explorerScrollContainer = getExplorerScrollContainer(explorer)

    // restore explorer scrollTop position if it exists
    const scrollTop = sessionStorage.getItem("explorerScrollTop")
    if (scrollTop && explorerScrollContainer) {
      explorerScrollContainer.scrollTop = parseInt(scrollTop)
    } else {
      // try to scroll to the active element if it exists
      const activeElement = explorerUl.querySelector(".active")
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: "smooth" })
      }
    }

    // Set up event handlers
    const explorerButtons = explorer.getElementsByClassName(
      "explorer-toggle",
    ) as HTMLCollectionOf<HTMLElement>
    for (const button of explorerButtons) {
      button.addEventListener("click", toggleExplorer)
      window.addCleanup(() => button.removeEventListener("click", toggleExplorer))
    }

    const explorerRoot = explorer as HTMLElement
    const backdrop = explorerRoot.querySelector(".explorer-backdrop") as HTMLElement | null
    if (backdrop) {
      const closeOnBackdrop = () => closeExplorer(explorerRoot)
      backdrop.addEventListener("click", closeOnBackdrop)
      window.addCleanup(() => backdrop.removeEventListener("click", closeOnBackdrop))
    }

    registerMobileSwipeGesture(explorerRoot)

    // Set up folder click handlers
    if (opts.folderClickBehavior === "collapse") {
      const folderButtons = explorer.getElementsByClassName(
        "folder-button",
      ) as HTMLCollectionOf<HTMLElement>
      for (const button of folderButtons) {
        button.addEventListener("click", toggleFolder)
        window.addCleanup(() => button.removeEventListener("click", toggleFolder))
      }
    }

    const folderIcons = explorer.getElementsByClassName(
      "folder-icon",
    ) as HTMLCollectionOf<HTMLElement>
    for (const icon of folderIcons) {
      icon.addEventListener("click", toggleFolder)
      window.addCleanup(() => icon.removeEventListener("click", toggleFolder))
    }
  }
}

document.addEventListener("prenav", async () => {
  // save explorer scrollTop position
  const explorer = getExplorerScrollContainer(document)
  if (!explorer) return
  sessionStorage.setItem("explorerScrollTop", explorer.scrollTop.toString())
})

document.addEventListener("nav", async (e: CustomEventMap["nav"]) => {
  const currentSlug = e.detail.url
  await setupExplorer(currentSlug)

  // if mobile hamburger is visible, collapse by default
  for (const explorer of document.getElementsByClassName("explorer")) {
    const explorerRoot = explorer as HTMLElement
    const mobileExplorer = explorerRoot.querySelector(".mobile-explorer") as HTMLElement | null
    if (!mobileExplorer) continue

    if (isMobileViewport()) {
      closeExplorer(explorerRoot)
    } else {
      setExplorerExpanded(explorerRoot, true)
      setMobileScrollLock(false)
    }

    mobileExplorer.classList.remove("hide-until-loaded")
  }
})

window.addEventListener("resize", () => {
  let shouldLockScroll = false

  for (const explorer of document.getElementsByClassName("explorer")) {
    const explorerRoot = explorer as HTMLElement
    if (!isMobileViewport()) {
      setExplorerExpanded(explorerRoot, true)
      continue
    }

    if (isExplorerExpanded(explorerRoot)) {
      shouldLockScroll = true
    }
  }

  setMobileScrollLock(shouldLockScroll)
})

function setFolderState(folderElement: HTMLElement, collapsed: boolean) {
  return collapsed ? folderElement.classList.remove("open") : folderElement.classList.add("open")
}
