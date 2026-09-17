"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type SyntheticEvent,
} from "react"

import {
  getImageLoadingPolicy,
  useImageLoadingPolicy,
  useNearViewport,
  type ImageListKind,
} from "@/lib/image-loading"
import {
  decideAdaptiveImageConcurrency,
  getImageLabConcurrency,
  percentile,
  sortImageLabQueue,
  summarizeImageLabMetrics,
  type ImageLabConfig,
  type ImageLabPriority,
} from "@/lib/image-loading-lab"

type RuntimeMetric = {
  id: string
  priority: ImageLabPriority
  sequence: number
  registeredAt: number
  nearAt?: number
  visibleAt?: number
  grantedAt?: number
  loadedAt?: number
  decodedAt?: number
  failedAt?: number
  timedOutAt?: number
  currentSrc?: string
  requestStart?: number
  responseEnd?: number
  decodeTail?: number
  currentVisible: boolean
  currentNear: boolean
}

type QueueEntry = {
  id: string
  priority: ImageLabPriority
  sequence: number
  grant: () => void
  timeout?: number
  state: "pending" | "active" | "done"
}

type TimedValue = { at: number; value: number }

export type ImageLoadingLabSnapshot = {
  enabled: boolean
  variant: ImageLabConfig["variant"]
  runId?: string
  listKind: ImageListKind
  startedAt: number
  capturedAt: number
  concurrency: number | "unbounded"
  peakActive: number
  activeCount: number
  pendingCount: number
  decodeBacklog: number
  visible: { total: number; complete: number }
  near: { total: number; complete: number }
  metrics: ReturnType<typeof summarizeImageLabMetrics>
  longTasks: { count: number; totalDuration: number; maxDuration: number }
  maxFrameGap: number
  cls: number
  fcp?: number
  lcp?: { startTime: number; size?: number; url?: string }
  environment: {
    viewport: [number, number]
    hardwareConcurrency?: number
    deviceMemory?: number
    effectiveType?: string
    saveData?: boolean
  }
  concurrencyChanges: Array<{
    at: number
    from: number
    to: number
    reason: string
  }>
  images: RuntimeMetric[]
}

type NavigatorWithDeviceSignals = Navigator & {
  deviceMemory?: number
  connection?: { effectiveType?: string; saveData?: boolean }
}

type LayoutShiftEntry = PerformanceEntry & { value?: number; hadRecentInput?: boolean }
type LargestContentfulPaintEntry = PerformanceEntry & {
  size?: number
  url?: string
}

const REQUEST_TIMEOUT_MS = 15_000

class ImageLoadingLabController {
  readonly config: ImageLabConfig
  readonly listKind: ImageListKind
  private startedAt = performance.now()
  private sequence = 0
  private entries = new Map<string, QueueEntry>()
  private metrics = new Map<string, RuntimeMetric>()
  private activeIds = new Set<string>()
  private concurrency: number
  private peakActive = 0
  private decodeBacklog = 0
  private completedSinceAdjustment = 0
  private lastAdjustedAt = this.startedAt
  private saturatedSince?: number
  private longTasks: TimedValue[] = []
  private longFrames: TimedValue[] = []
  private decodeTails: TimedValue[] = []
  private cls = 0
  private fcp?: number
  private lcp?: { startTime: number; size?: number; url?: string }
  private concurrencyChanges: ImageLoadingLabSnapshot["concurrencyChanges"] = []
  private observers: PerformanceObserver[] = []
  private adaptiveTimer?: number
  private animationFrame?: number
  private disposed = false

  constructor(config: ImageLabConfig, listKind: ImageListKind, initialConcurrency: number) {
    this.config = config
    this.listKind = listKind
    this.concurrency = getImageLabConcurrency(config.variant) ?? initialConcurrency
  }

  start() {
    this.installPerformanceObservers()
    this.startFrameObserver()
    if (this.config.variant === "adaptive") {
      this.adaptiveTimer = window.setInterval(() => this.adjustAdaptiveConcurrency(), 1_000)
    }
    window.__imageLoadingLab = {
      snapshot: this.snapshot,
      reset: () => this.reset(),
    }
  }

  dispose() {
    this.disposed = true
    this.observers.forEach((observer) => observer.disconnect())
    if (this.adaptiveTimer !== undefined) window.clearInterval(this.adaptiveTimer)
    if (this.animationFrame !== undefined) window.cancelAnimationFrame(this.animationFrame)
    this.entries.forEach((entry) => {
      if (entry.timeout !== undefined) window.clearTimeout(entry.timeout)
    })
    if (window.__imageLoadingLab?.snapshot === this.snapshot) delete window.__imageLoadingLab
  }

  setInitialConcurrency(value: number) {
    if (this.config.variant !== "adaptive" || this.entries.size > 0) return
    this.concurrency = Math.max(2, Math.min(10, value))
  }

  register(
    id: string,
    priority: ImageLabPriority,
    state: { near: boolean; visible: boolean },
    grant: () => void,
  ) {
    const now = performance.now()
    const existingMetric = this.metrics.get(id)
    if (existingMetric) {
      existingMetric.priority = priority
      existingMetric.currentNear = state.near
      existingMetric.currentVisible = state.visible
      if (state.near && existingMetric.nearAt === undefined) existingMetric.nearAt = now
      if (state.visible && existingMetric.visibleAt === undefined) existingMetric.visibleAt = now
    } else {
      this.metrics.set(id, {
        id,
        priority,
        sequence: this.sequence,
        registeredAt: now,
        nearAt: state.near ? now : undefined,
        visibleAt: state.visible ? now : undefined,
        currentNear: state.near,
        currentVisible: state.visible,
      })
    }

    const existingEntry = this.entries.get(id)
    if (existingEntry) {
      existingEntry.priority = priority
      existingEntry.grant = grant
    } else {
      this.entries.set(id, {
        id,
        priority,
        sequence: this.sequence,
        grant,
        state: "pending",
      })
      this.sequence += 1
    }

    if (this.config.variant === "native") {
      this.grantEntry(this.entries.get(id)!)
    } else {
      this.pump()
    }
  }

  updateVisibility(
    id: string,
    state: { immediate: boolean; near: boolean; visible: boolean },
    grant: () => void,
  ) {
    if (!state.immediate && !state.near && !state.visible) return
    const priority: ImageLabPriority = state.visible
      ? "visible"
      : state.immediate
        ? "immediate"
        : "near"
    this.register(id, priority, { near: state.near, visible: state.visible }, grant)
  }

  unregister(id: string) {
    const entry = this.entries.get(id)
    if (!entry || entry.state === "done") return
    if (entry.timeout !== undefined) window.clearTimeout(entry.timeout)
    this.activeIds.delete(id)
    this.entries.delete(id)
    this.pump()
  }

  handleLoad(id: string, image: HTMLImageElement) {
    const metric = this.metrics.get(id)
    if (!metric || metric.loadedAt !== undefined || metric.failedAt !== undefined) return
    const now = performance.now()
    metric.loadedAt = now
    metric.currentSrc = image.currentSrc || image.src
    this.completeNetwork(id)
    this.decodeBacklog += 1

    const decode = typeof image.decode === "function" ? image.decode() : Promise.resolve()
    void decode
      .catch(() => undefined)
      .finally(() => {
        const decodedAt = performance.now()
        metric.decodedAt = decodedAt
        const resource = this.findResource(metric.currentSrc)
        metric.decodeTail = resource ? Math.max(0, decodedAt - resource.responseEnd) : undefined
        if (metric.decodeTail !== undefined) {
          this.decodeTails.push({ at: decodedAt, value: metric.decodeTail })
        }
        this.decodeBacklog = Math.max(0, this.decodeBacklog - 1)
      })
  }

  handleError(id: string) {
    const metric = this.metrics.get(id)
    if (metric && metric.failedAt === undefined) metric.failedAt = performance.now()
    this.completeNetwork(id)
  }

  snapshot = (): ImageLoadingLabSnapshot => {
    const capturedAt = performance.now()
    const images = [...this.metrics.values()].map((metric) => {
      const resource = this.findResource(metric.currentSrc)
      return {
        ...metric,
        requestStart: resource?.requestStart,
        responseEnd: resource?.responseEnd,
        resourceDuration: resource?.duration,
        transferSize: resource?.transferSize,
      }
    })
    const completed = (metric: RuntimeMetric) =>
      metric.decodedAt !== undefined ||
      metric.failedAt !== undefined ||
      metric.timedOutAt !== undefined
    const visible = images.filter((metric) => metric.currentVisible)
    const near = images.filter((metric) => metric.currentNear)
    const summary = summarizeImageLabMetrics(images, this.startedAt)
    const navigatorSignals = navigator as NavigatorWithDeviceSignals

    return {
      enabled: this.config.enabled,
      variant: this.config.variant,
      runId: this.config.runId,
      listKind: this.listKind,
      startedAt: this.startedAt,
      capturedAt,
      concurrency: Number.isFinite(this.concurrency) ? this.concurrency : "unbounded",
      peakActive: this.peakActive,
      activeCount: this.activeIds.size,
      pendingCount: [...this.entries.values()].filter((entry) => entry.state === "pending").length,
      decodeBacklog: this.decodeBacklog,
      visible: { total: visible.length, complete: visible.filter(completed).length },
      near: { total: near.length, complete: near.filter(completed).length },
      metrics: summary,
      longTasks: {
        count: this.longTasks.length,
        totalDuration: this.longTasks.reduce((total, entry) => total + entry.value, 0),
        maxDuration: Math.max(0, ...this.longTasks.map((entry) => entry.value)),
      },
      maxFrameGap: Math.max(0, ...this.longFrames.map((entry) => entry.value)),
      cls: this.cls,
      fcp: this.fcp,
      lcp: this.lcp,
      environment: {
        viewport: [window.innerWidth, window.innerHeight],
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigatorSignals.deviceMemory,
        effectiveType: navigatorSignals.connection?.effectiveType,
        saveData: navigatorSignals.connection?.saveData,
      },
      concurrencyChanges: [...this.concurrencyChanges],
      images,
    }
  }

  reset() {
    this.startedAt = performance.now()
    this.longTasks = []
    this.longFrames = []
    this.decodeTails = []
    this.cls = 0
    this.fcp = undefined
    this.lcp = undefined
    this.concurrencyChanges = []
  }

  private pump() {
    if (this.disposed) return
    const available = Number.isFinite(this.concurrency)
      ? Math.max(0, this.concurrency - this.activeIds.size)
      : Number.POSITIVE_INFINITY
    if (available <= 0) {
      this.updateSaturation()
      return
    }

    const pending = sortImageLabQueue(
      [...this.entries.values()].filter((entry) => entry.state === "pending"),
    )
    pending.slice(0, available).forEach((entry) => this.grantEntry(entry))
    this.updateSaturation()
  }

  private grantEntry(entry: QueueEntry) {
    if (entry.state !== "pending") return
    entry.state = "active"
    this.activeIds.add(entry.id)
    this.peakActive = Math.max(this.peakActive, this.activeIds.size)
    const metric = this.metrics.get(entry.id)
    if (metric && metric.grantedAt === undefined) metric.grantedAt = performance.now()
    entry.timeout = window.setTimeout(() => {
      const timedMetric = this.metrics.get(entry.id)
      if (timedMetric && timedMetric.loadedAt === undefined && timedMetric.failedAt === undefined) {
        timedMetric.timedOutAt = performance.now()
      }
      this.completeNetwork(entry.id)
    }, REQUEST_TIMEOUT_MS)
    entry.grant()
  }

  private completeNetwork(id: string) {
    const entry = this.entries.get(id)
    if (!entry || entry.state === "done") return
    entry.state = "done"
    if (entry.timeout !== undefined) window.clearTimeout(entry.timeout)
    this.activeIds.delete(id)
    this.completedSinceAdjustment += 1
    this.pump()
  }

  private adjustAdaptiveConcurrency() {
    const now = performance.now()
    const recentAfter = now - 2_000
    const recentLongTasks = this.longTasks.filter((entry) => entry.at >= recentAfter)
    const recentLongFrames = this.longFrames.filter((entry) => entry.at >= recentAfter)
    const recentDecodeTails = this.decodeTails
      .filter((entry) => entry.at >= recentAfter)
      .map((entry) => entry.value)
    const pendingCount = [...this.entries.values()].filter(
      (entry) => entry.state === "pending",
    ).length
    const decision = decideAdaptiveImageConcurrency(this.concurrency, {
      now,
      lastAdjustedAt: this.lastAdjustedAt,
      pendingCount,
      activeCount: this.activeIds.size,
      saturatedForMs: this.saturatedSince === undefined ? 0 : now - this.saturatedSince,
      completedSinceAdjustment: this.completedSinceAdjustment,
      longTaskCount: recentLongTasks.length,
      longFrameCount: recentLongFrames.length,
      decodeBacklog: this.decodeBacklog,
      decodeTailP75: percentile(recentDecodeTails, 0.75),
    })
    if (decision.concurrency === this.concurrency) return

    const previous = this.concurrency
    this.concurrency = decision.concurrency
    this.lastAdjustedAt = now
    this.completedSinceAdjustment = 0
    this.concurrencyChanges.push({
      at: now,
      from: previous,
      to: this.concurrency,
      reason: decision.reason,
    })
    this.pump()
  }

  private updateSaturation(now = performance.now()) {
    const pending = [...this.entries.values()].some((entry) => entry.state === "pending")
    const saturated =
      Number.isFinite(this.concurrency) && pending && this.activeIds.size >= this.concurrency
    if (saturated) this.saturatedSince ??= now
    else this.saturatedSince = undefined
  }

  private findResource(src?: string) {
    if (!src) return undefined
    return performance
      .getEntriesByName(src)
      .filter((entry): entry is PerformanceResourceTiming => entry.entryType === "resource")
      .at(-1)
  }

  private installPerformanceObservers() {
    const install = (type: string, callback: (entries: PerformanceEntry[]) => void) => {
      if (!PerformanceObserver.supportedEntryTypes.includes(type)) return
      const observer = new PerformanceObserver((list) => callback(list.getEntries()))
      observer.observe({ type, buffered: true })
      this.observers.push(observer)
    }

    install("longtask", (entries) => {
      if (this.activeIds.size === 0) return
      const now = performance.now()
      entries.forEach((entry) => this.longTasks.push({ at: now, value: entry.duration }))
    })
    install("layout-shift", (entries) => {
      entries.forEach((entry) => {
        const shift = entry as LayoutShiftEntry
        if (!shift.hadRecentInput) this.cls += shift.value ?? 0
      })
    })
    install("paint", (entries) => {
      const fcp = entries.find((entry) => entry.name === "first-contentful-paint")
      if (fcp) this.fcp = fcp.startTime
    })
    install("largest-contentful-paint", (entries) => {
      const entry = entries.at(-1) as LargestContentfulPaintEntry | undefined
      if (entry) this.lcp = { startTime: entry.startTime, size: entry.size, url: entry.url }
    })
  }

  private startFrameObserver() {
    let previous = performance.now()
    const frame = (now: number) => {
      const gap = now - previous
      previous = now
      if (this.activeIds.size > 0 && gap >= 50) this.longFrames.push({ at: now, value: gap })
      this.animationFrame = window.requestAnimationFrame(frame)
    }
    this.animationFrame = window.requestAnimationFrame(frame)
  }
}

type ImageLoadingLabContextValue = {
  config: ImageLabConfig
  controller: ImageLoadingLabController | null
}

const ImageLoadingLabContext = createContext<ImageLoadingLabContextValue>({
  config: { enabled: false, variant: "native" },
  controller: null,
})

export function ImageLoadingLabProvider({
  config,
  listKind,
  children,
}: {
  config: ImageLabConfig
  listKind: ImageListKind
  children: ReactNode
}) {
  const adaptiveInitialPolicy = useImageLoadingPolicy("anime")
  const [controller] = useState<ImageLoadingLabController | null>(() => {
    if (!config.enabled || typeof window === "undefined") return null
    const navigatorSignals = navigator as NavigatorWithDeviceSignals
    const initialPolicy = getImageLoadingPolicy("anime", {
      desktop: window.matchMedia("(min-width: 1024px)").matches,
      saveData: navigatorSignals.connection?.saveData,
      effectiveType: navigatorSignals.connection?.effectiveType,
    })
    return new ImageLoadingLabController(config, listKind, initialPolicy.immediateBudget)
  })

  useEffect(() => {
    if (!controller) return
    controller.start()
    return () => controller.dispose()
  }, [controller])

  useEffect(() => {
    controller?.setInitialConcurrency(adaptiveInitialPolicy.immediateBudget)
  }, [adaptiveInitialPolicy.immediateBudget, controller])

  const value = useMemo(() => ({ config, controller }), [config, controller])
  return <ImageLoadingLabContext.Provider value={value}>{children}</ImageLoadingLabContext.Provider>
}

export function useImageLoadingLabImage({
  id,
  immediate,
  nearViewportMarginPx,
}: {
  id: string
  immediate: boolean
  nearViewportMarginPx: number
}) {
  const { config, controller } = useContext(ImageLoadingLabContext)
  const native = useNearViewport<HTMLElement>(immediate, nearViewportMarginPx)
  const [labGranted, setLabGranted] = useState(false)
  const grant = useCallback(() => setLabGranted(true), [])

  useEffect(() => {
    const element = native.elementRef.current
    if (!controller || !element) return

    let near = immediate || native.shouldLoad
    let visible = false
    const sync = () => controller.updateVisibility(id, { immediate, near, visible }, grant)

    if (config.variant === "native" && native.shouldLoad) {
      sync()
      const existingImage = element.querySelector("img")
      if (existingImage?.complete) {
        if (existingImage.naturalWidth > 0) controller.handleLoad(id, existingImage)
        else controller.handleError(id)
      }
    }
    if (config.variant !== "native" && immediate) sync()

    if (typeof IntersectionObserver === "undefined") {
      const fallback = window.setTimeout(() => {
        near = true
        visible = true
        sync()
      }, 0)
      return () => window.clearTimeout(fallback)
    }

    const visibleObserver = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting)
        sync()
      },
      { rootMargin: "0px" },
    )
    visibleObserver.observe(element)

    let nearObserver: IntersectionObserver | undefined
    if (config.variant !== "native" && !immediate) {
      nearObserver = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting) return
          near = true
          sync()
          nearObserver?.disconnect()
        },
        { rootMargin: `${nearViewportMarginPx}px 0px` },
      )
      nearObserver.observe(element)
    }

    return () => {
      visibleObserver.disconnect()
      nearObserver?.disconnect()
    }
  }, [
    config.variant,
    controller,
    grant,
    id,
    immediate,
    native.elementRef,
    native.shouldLoad,
    nearViewportMarginPx,
  ])

  useEffect(() => () => controller?.unregister(id), [controller, id])

  const onLoad = useCallback(
    (event: SyntheticEvent<HTMLImageElement>) => controller?.handleLoad(id, event.currentTarget),
    [controller, id],
  )
  const onError = useCallback(() => controller?.handleError(id), [controller, id])

  return {
    elementRef: native.elementRef,
    shouldLoad: config.variant === "native" ? native.shouldLoad : labGranted,
    onLoad,
    onError,
  }
}

declare global {
  interface Window {
    __imageLoadingLab?: {
      snapshot: () => ImageLoadingLabSnapshot
      reset: () => void
    }
  }
}
