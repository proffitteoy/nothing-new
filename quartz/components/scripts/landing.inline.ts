const SCROLLABLE_SELECTORS = [
  ".explorer-content",
  ".explorer-ul",
  ".toc-content",
  ".backlinks > ul.overflow",
]

function resolveEventElement(target: EventTarget | null): Element | null {
  if (target instanceof Element) return target
  if (target instanceof Node) return target.parentElement
  return null
}

function getScrollableContainer(target: EventTarget | null): HTMLElement | null {
  const element = resolveEventElement(target)
  if (!element) return null

  for (const selector of SCROLLABLE_SELECTORS) {
    const container = element.closest(selector) as HTMLElement | null
    if (container) return container
  }

  return null
}

function normalizeWheelDelta(deltaY: number, deltaMode: number, viewportHeight: number): number {
  // 0: px, 1: line, 2: page
  if (deltaMode === 1) return deltaY * 16
  if (deltaMode === 2) return deltaY * viewportHeight
  return deltaY
}

function scrollWithWheel(container: HTMLElement, deltaY: number): boolean {
  if (container.scrollHeight <= container.clientHeight + 1) return false

  const previousTop = container.scrollTop
  container.scrollTop += deltaY
  return container.scrollTop !== previousTop
}

function shouldTriggerLandingScroll(): boolean {
  return document.body.dataset.slug === "index" && window.scrollY <= 8
}

function jumpToMainContent(): boolean {
  const mainContent = document.getElementById("main-content")
  if (!mainContent) return false

  mainContent.scrollIntoView({ behavior: "smooth", block: "start" })
  return true
}

document.addEventListener("nav", () => {
  let landingConsumed = false

  const onWheel = (event: WheelEvent) => {
    const container = getScrollableContainer(event.target)
    const deltaY = normalizeWheelDelta(event.deltaY, event.deltaMode, window.innerHeight)

    if (container) {
      if (scrollWithWheel(container, deltaY)) {
        event.preventDefault()
      }
      return
    }

    if (landingConsumed || !shouldTriggerLandingScroll()) return
    if (deltaY <= 0) return

    if (jumpToMainContent()) {
      landingConsumed = true
      event.preventDefault()
    }
  }

  const onKeydown = (event: KeyboardEvent) => {
    if (landingConsumed || !shouldTriggerLandingScroll()) return

    const element = resolveEventElement(event.target)
    const tagName = element?.tagName.toLowerCase()
    if (tagName === "input" || tagName === "textarea" || element?.isContentEditable) return

    const shouldTrigger =
      event.key === "ArrowDown" || event.key === "PageDown" || event.key === " "
    if (!shouldTrigger) return

    if (jumpToMainContent()) {
      landingConsumed = true
      event.preventDefault()
    }
  }

  document.addEventListener("wheel", onWheel, { passive: false })
  document.addEventListener("keydown", onKeydown)

  window.addCleanup(() => {
    document.removeEventListener("wheel", onWheel)
    document.removeEventListener("keydown", onKeydown)
  })
})
