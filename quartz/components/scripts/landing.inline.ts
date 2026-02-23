const SCROLLABLE_SELECTORS = [
  ".explorer-content",
  ".explorer-ul",
  ".toc-content",
  ".backlinks > ul.overflow",
]

const INTRO_TEXT = "\u4e3a\u5b66\u65e5\u76ca\u4e3a\u9053\u65e5\u635f"
const INTRO_TYPING_DELAY = 280
const INTRO_TYPING_INTERVAL = 220
const ROOT_LOCK_ATTR = "data-landing-lock"

type IntroState = {
  overlay: HTMLElement
  title: HTMLElement
  typingTimer?: number
  startTimer?: number
}

let introState: IntroState | null = null

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

function canShowLandingIntro(): boolean {
  return document.body.dataset.slug === "index" && window.scrollY <= 8 && !window.location.hash
}

function jumpToMainContent(): boolean {
  const mainContent = document.getElementById("main-content")
  if (!mainContent) return false

  mainContent.scrollIntoView({ behavior: "smooth", block: "start" })
  return true
}

function clearIntroTimers(state: IntroState) {
  if (state.startTimer !== undefined) {
    window.clearTimeout(state.startTimer)
    state.startTimer = undefined
  }

  if (state.typingTimer !== undefined) {
    window.clearInterval(state.typingTimer)
    state.typingTimer = undefined
  }
}

function destroyLandingIntro() {
  if (!introState) return

  clearIntroTimers(introState)
  introState.overlay.remove()
  introState = null
  document.documentElement.removeAttribute(ROOT_LOCK_ATTR)
}

function revealLandingIntro(scrollToContent: boolean): boolean {
  if (!introState) return false

  const activeIntro = introState
  introState = null
  clearIntroTimers(activeIntro)
  document.documentElement.removeAttribute(ROOT_LOCK_ATTR)

  activeIntro.overlay.classList.add("is-leaving")
  window.setTimeout(() => {
    activeIntro.overlay.remove()
  }, 460)

  if (scrollToContent) {
    window.setTimeout(() => {
      void jumpToMainContent()
    }, 70)
  }

  return true
}

function activateLandingIntro(): boolean {
  if (!canShowLandingIntro()) return false
  destroyLandingIntro()

  const overlay = document.createElement("div")
  overlay.className = "landing-intro"
  overlay.innerHTML = `
    <div class="landing-intro-inner">
      <h1 class="landing-intro-title" aria-label="${INTRO_TEXT}"></h1>
    </div>
  `

  const title = overlay.querySelector(".landing-intro-title") as HTMLElement | null
  if (!title) return false

  introState = {
    overlay,
    title,
  }

  document.documentElement.setAttribute(ROOT_LOCK_ATTR, "on")
  document.body.appendChild(overlay)

  introState.startTimer = window.setTimeout(() => {
    let currentIndex = 0
    introState?.title && (introState.title.textContent = "")

    introState!.typingTimer = window.setInterval(() => {
      if (!introState) return
      currentIndex += 1
      introState.title.textContent = INTRO_TEXT.slice(0, currentIndex)

      if (currentIndex >= INTRO_TEXT.length) {
        clearIntroTimers(introState)
      }
    }, INTRO_TYPING_INTERVAL)
  }, INTRO_TYPING_DELAY)

  return true
}

document.addEventListener("nav", () => {
  destroyLandingIntro()
  let touchStartY: number | null = null
  activateLandingIntro()

  const onWheel = (event: WheelEvent) => {
    const deltaY = normalizeWheelDelta(event.deltaY, event.deltaMode, window.innerHeight)

    if (introState) {
      if (deltaY > 0) {
        revealLandingIntro(true)
      }
      event.preventDefault()
      return
    }

    const container = getScrollableContainer(event.target)
    if (!container) return

    if (scrollWithWheel(container, deltaY)) {
      event.preventDefault()
    }
  }

  const onKeydown = (event: KeyboardEvent) => {
    if (!introState) return

    const element = resolveEventElement(event.target)
    const tagName = element?.tagName.toLowerCase()
    if (tagName === "input" || tagName === "textarea" || element?.isContentEditable) return

    const shouldReveal =
      event.key === "ArrowDown" || event.key === "PageDown" || event.key === " " || event.key === "Enter"
    if (!shouldReveal) return

    if (revealLandingIntro(true)) {
      event.preventDefault()
    }
  }

  const onTouchStart = (event: TouchEvent) => {
    if (!introState) return
    touchStartY = event.touches[0]?.clientY ?? null
  }

  const onTouchMove = (event: TouchEvent) => {
    if (!introState || touchStartY === null) return
    const currentY = event.touches[0]?.clientY
    if (currentY === undefined) return

    const deltaY = touchStartY - currentY
    if (deltaY > 18) {
      revealLandingIntro(true)
      touchStartY = null
      event.preventDefault()
      return
    }

    if (Math.abs(deltaY) > 4) {
      event.preventDefault()
    }
  }

  const onTouchEnd = () => {
    touchStartY = null
  }

  document.addEventListener("wheel", onWheel, { passive: false })
  document.addEventListener("keydown", onKeydown)
  document.addEventListener("touchstart", onTouchStart, { passive: true })
  document.addEventListener("touchmove", onTouchMove, { passive: false })
  document.addEventListener("touchend", onTouchEnd, { passive: true })

  window.addCleanup(() => {
    document.removeEventListener("wheel", onWheel)
    document.removeEventListener("keydown", onKeydown)
    document.removeEventListener("touchstart", onTouchStart)
    document.removeEventListener("touchmove", onTouchMove)
    document.removeEventListener("touchend", onTouchEnd)
    destroyLandingIntro()
  })
})

