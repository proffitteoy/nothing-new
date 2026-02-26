const SCROLLABLE_SELECTORS = [
  ".explorer-content",
  ".explorer-ul",
  ".toc-content",
  ".backlinks > ul.overflow",
]

type IntroToken = {
  text: string
  pinyin?: string
  candidates?: string
  pauseAfter?: number
}

const INTRO_TOKENS: IntroToken[] = [
  { text: "\u4e3a", pinyin: "wei", candidates: "1.\u4e3a 2.\u4f4d 3.\u672a" },
  { text: "\u5b66", pinyin: "xue", candidates: "1.\u5b66 2.\u96ea 3.\u7a74", pauseAfter: 620 },
  { text: "\u65e5", pinyin: "ri", candidates: "1.\u65e5 2.\u9a72" },
  { text: "\u76ca", pinyin: "yi", candidates: "1.\u76ca 2.\u610f 3.\u8bae", pauseAfter: 110 },
  { text: "\uff0c", pauseAfter: 240 },
  {
    text: "\u4e3a\u9053\u65e5\u635f",
    pinyin: "weidaorisun",
    candidates: "1.\u4e3a\u9053\u65e5\u635f 2.\u4e3a\u9053\u65e5\u7b0b",
    pauseAfter: 90,
  },
]

const INTRO_TEXT = INTRO_TOKENS.map((token) => token.text).join("")
const INTRO_BOOT_DELAY = 280
const INTRO_PREPARE_DELAY = 100
const INTRO_KEY_INTERVAL = 85
const INTRO_CANDIDATE_DELAY = 180
const INTRO_COMMIT_DELAY = 95
const INTRO_DEFAULT_GAP = 95
const ROOT_LOCK_ATTR = "data-landing-lock"
const BG_READY_ATTR = "data-bg-ready"
const MOBILE_BREAKPOINT = "(max-width: 800px)"
const BG_READY_TIMEOUT = 1200

type ImeMode = "idle" | "typing" | "candidate" | "commit"

type IntroState = {
  overlay: HTMLElement
  title: HTMLElement
  ime: HTMLElement
  timers: number[]
  composedText: string
}

let introState: IntroState | null = null
let backgroundDecorReady = false

function canUseDesktopEffects(): boolean {
  const connection = (navigator as any).connection
  const saveData = connection?.saveData === true
  const effectiveType = String(connection?.effectiveType ?? "")
  const slowNetwork = effectiveType === "slow-2g" || effectiveType === "2g"
  return !saveData && !slowNetwork && !window.matchMedia(MOBILE_BREAKPOINT).matches
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function scheduleBackgroundDecor() {
  if (document.documentElement.hasAttribute(BG_READY_ATTR) || backgroundDecorReady) return
  if (!canUseDesktopEffects()) return
  backgroundDecorReady = true

  const activateBackground = () => {
    document.documentElement.setAttribute(BG_READY_ATTR, "on")
    backgroundDecorReady = false
  }

  const maybeRequestIdleCallback = (window as any).requestIdleCallback
  if (typeof maybeRequestIdleCallback === "function") {
    maybeRequestIdleCallback(activateBackground, { timeout: BG_READY_TIMEOUT })
  } else {
    window.setTimeout(activateBackground, 360)
  }
}

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
  return (
    canUseDesktopEffects() &&
    !prefersReducedMotion() &&
    document.body.dataset.slug === "index" &&
    window.scrollY <= 8 &&
    !window.location.hash
  )
}

function jumpToMainContent(): boolean {
  const mainContent = document.getElementById("main-content")
  if (!mainContent) return false

  mainContent.scrollIntoView({ behavior: "smooth", block: "start" })
  return true
}

function scheduleIntroTask(state: IntroState, callback: () => void, delay: number) {
  const timer = window.setTimeout(() => {
    state.timers = state.timers.filter((activeTimer) => activeTimer !== timer)
    callback()
  }, delay)

  state.timers.push(timer)
}

function clearIntroTimers(state: IntroState) {
  for (const timer of state.timers) {
    window.clearTimeout(timer)
  }

  state.timers = []
}

function setImePrompt(state: IntroState, text: string, mode: ImeMode) {
  state.ime.textContent = text
  state.ime.dataset.mode = mode
}

function runIntroTyping(state: IntroState, tokenIndex: number) {
  if (!introState || introState !== state) return

  if (tokenIndex >= INTRO_TOKENS.length) {
    setImePrompt(state, "", "idle")
    return
  }

  const token = INTRO_TOKENS[tokenIndex]

  const commitCurrentToken = () => {
    if (!introState || introState !== state) return

    state.composedText += token.text
    state.title.textContent = state.composedText
    setImePrompt(state, token.pinyin ? `\u4e0a\u5c4f: ${token.text}` : "", token.pinyin ? "commit" : "idle")

    scheduleIntroTask(state, () => {
      if (!introState || introState !== state) return
      setImePrompt(state, "", "idle")
      runIntroTyping(state, tokenIndex + 1)
    }, token.pauseAfter ?? INTRO_DEFAULT_GAP)
  }

  if (!token.pinyin) {
    scheduleIntroTask(state, commitCurrentToken, INTRO_COMMIT_DELAY)
    return
  }

  let letterIndex = 0
  const typePinyin = () => {
    if (!introState || introState !== state) return

    letterIndex += 1
    const typedPinyin = token.pinyin!.slice(0, letterIndex)
    setImePrompt(state, `\u8f93\u5165: ${typedPinyin}`, "typing")

    if (letterIndex < token.pinyin!.length) {
      scheduleIntroTask(state, typePinyin, INTRO_KEY_INTERVAL)
      return
    }

    if (token.candidates) {
      scheduleIntroTask(state, () => {
        if (!introState || introState !== state) return
        setImePrompt(state, `\u5019\u9009: ${token.candidates}`, "candidate")
        scheduleIntroTask(state, commitCurrentToken, INTRO_CANDIDATE_DELAY)
      }, INTRO_KEY_INTERVAL)
      return
    }

    scheduleIntroTask(state, commitCurrentToken, INTRO_COMMIT_DELAY)
  }

  scheduleIntroTask(state, typePinyin, INTRO_PREPARE_DELAY)
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
      <div class="landing-intro-stage">
        <h1 class="landing-intro-title" aria-label="${INTRO_TEXT}"></h1>
      </div>
      <p class="landing-intro-ime" data-mode="idle" aria-hidden="true"></p>
    </div>
  `

  const title = overlay.querySelector(".landing-intro-title") as HTMLElement | null
  const ime = overlay.querySelector(".landing-intro-ime") as HTMLElement | null
  if (!title || !ime) return false

  introState = {
    overlay,
    title,
    ime,
    timers: [],
    composedText: "",
  }

  document.documentElement.setAttribute(ROOT_LOCK_ATTR, "on")
  document.body.appendChild(overlay)
  introState.title.textContent = ""
  setImePrompt(introState, "", "idle")

  const activeIntro = introState
  scheduleIntroTask(activeIntro, () => {
    runIntroTyping(activeIntro, 0)
  }, INTRO_BOOT_DELAY)

  return true
}

document.addEventListener("nav", () => {
  scheduleBackgroundDecor()
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
    const targetElement = element instanceof HTMLElement ? element : null
    const tagName = targetElement?.tagName.toLowerCase()
    if (tagName === "input" || tagName === "textarea" || targetElement?.isContentEditable) return

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
