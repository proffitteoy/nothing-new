export const IMAGE_EXPERIMENT_VARIANTS = [
  "native",
  "gate-unbounded",
  "fixed-2",
  "fixed-4",
  "fixed-6",
  "fixed-8",
  "fixed-12",
  "adaptive",
] as const

export type ImageExperimentVariant = (typeof IMAGE_EXPERIMENT_VARIANTS)[number]
export type ImageLabPriority = "near" | "immediate" | "visible"

export type ImageLabConfig = {
  enabled: boolean
  variant: ImageExperimentVariant
  runId?: string
}

export type ImageLabSearchParams = Record<string, string | string[] | undefined>

export const NATIVE_IMAGE_LAB_CONFIG: ImageLabConfig = {
  enabled: false,
  variant: "native",
}

const VARIANT_SET = new Set<string>(IMAGE_EXPERIMENT_VARIANTS)
const RUN_ID_PATTERN = /[^a-zA-Z0-9_.-]/g

function firstSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export function resolveImageLabConfig(
  searchParams: ImageLabSearchParams,
  enabled: boolean,
): ImageLabConfig {
  if (!enabled) return NATIVE_IMAGE_LAB_CONFIG

  const requestedVariant = firstSearchValue(searchParams.imagePolicy)
  const variant =
    requestedVariant && VARIANT_SET.has(requestedVariant)
      ? (requestedVariant as ImageExperimentVariant)
      : "native"
  const rawRunId = firstSearchValue(searchParams.imageRun)?.trim()
  const runId = rawRunId?.replace(RUN_ID_PATTERN, "-").slice(0, 64) || undefined

  return { enabled: true, variant, runId }
}

export const IMAGE_LAB_PRIORITY_RANK: Record<ImageLabPriority, number> = {
  near: 0,
  immediate: 1,
  visible: 2,
}

export type ImageLabQueueItem = {
  id: string
  priority: ImageLabPriority
  sequence: number
}

export function sortImageLabQueue<T extends ImageLabQueueItem>(items: readonly T[]) {
  return [...items].sort(
    (left, right) =>
      IMAGE_LAB_PRIORITY_RANK[right.priority] - IMAGE_LAB_PRIORITY_RANK[left.priority] ||
      left.sequence - right.sequence,
  )
}

export function getImageLabConcurrency(variant: ImageExperimentVariant) {
  if (variant === "gate-unbounded" || variant === "native") return Number.POSITIVE_INFINITY
  const match = /^fixed-(\d+)$/.exec(variant)
  return match ? Number(match[1]) : undefined
}

export type AdaptiveImageSignals = {
  now: number
  lastAdjustedAt: number
  pendingCount: number
  activeCount: number
  saturatedForMs: number
  completedSinceAdjustment: number
  longTaskCount: number
  longFrameCount: number
  decodeBacklog: number
  decodeTailP75?: number
}

export type AdaptiveImageDecision = {
  concurrency: number
  reason: "cooldown" | "pressure" | "headroom" | "steady"
}

export function decideAdaptiveImageConcurrency(
  currentConcurrency: number,
  signals: AdaptiveImageSignals,
): AdaptiveImageDecision {
  const current = Math.max(2, Math.min(10, currentConcurrency))
  if (signals.now - signals.lastAdjustedAt < 2_000) {
    return { concurrency: current, reason: "cooldown" }
  }

  const underPressure =
    signals.longTaskCount > 0 ||
    signals.longFrameCount > 0 ||
    signals.decodeBacklog > current ||
    (signals.decodeTailP75 ?? 0) > 50
  if (underPressure) {
    return { concurrency: Math.max(2, current - 1), reason: "pressure" }
  }

  const hasHeadroom =
    signals.pendingCount > 0 &&
    signals.activeCount >= current &&
    signals.saturatedForMs >= 1_000 &&
    signals.completedSinceAdjustment >= 3 &&
    signals.decodeBacklog <= 1 &&
    (signals.decodeTailP75 === undefined || signals.decodeTailP75 <= 20)
  if (hasHeadroom) {
    return { concurrency: Math.min(10, current + 1), reason: "headroom" }
  }

  return { concurrency: current, reason: "steady" }
}

export function percentile(values: readonly number[], quantile: number) {
  if (values.length === 0) return undefined
  const sorted = [...values].sort((left, right) => left - right)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * quantile) - 1))
  return sorted[index]
}

export type ImageLabMetricSample = {
  visibleAt?: number
  decodedAt?: number
  failed?: boolean
  timedOut?: boolean
  resourceDuration?: number
  transferSize?: number
  decodeTail?: number
}

export function summarizeImageLabMetrics(
  samples: readonly ImageLabMetricSample[],
  startedAt: number,
) {
  const visible = samples.filter((sample) => sample.visibleAt !== undefined)
  const visibleDecoded = visible
    .map((sample) => sample.decodedAt)
    .filter((value): value is number => value !== undefined)
  const resourceDurations = samples
    .map((sample) => sample.resourceDuration)
    .filter((value): value is number => value !== undefined)
  const decodeTails = samples
    .map((sample) => sample.decodeTail)
    .filter((value): value is number => value !== undefined)

  return {
    imageCount: samples.length,
    visibleCount: visible.length,
    visibleDecodedCount: visibleDecoded.length,
    visibleCompletionMs:
      visible.length > 0 && visibleDecoded.length === visible.length
        ? Math.max(...visibleDecoded) - startedAt
        : undefined,
    requestCount: resourceDurations.length,
    transferSize: samples.reduce((total, sample) => total + (sample.transferSize ?? 0), 0),
    resourceDurationP50: percentile(resourceDurations, 0.5),
    resourceDurationP75: percentile(resourceDurations, 0.75),
    decodeTailP75: percentile(decodeTails, 0.75),
    failedCount: samples.filter((sample) => sample.failed).length,
    timedOutCount: samples.filter((sample) => sample.timedOut).length,
  }
}
