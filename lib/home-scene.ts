export const HOME_CYCLE_SECONDS = 300
export const HOME_IMAGE_SIZE = { width: 1672, height: 941 }

// Audited envelope in original image pixels, including veil, bouquet and hands.
// A conservative exclusion mask, not a cut-out asset.
export const HOME_PERSON = [
  [550, 0],
  [1220, 0],
  [1270, 130],
  [1330, 280],
  [1440, 545],
  [1450, 650],
  [1510, 790],
  [1470, 941],
  [235, 941],
  [285, 800],
  [390, 715],
  [465, 635],
  [530, 535],
  [495, 420],
  [530, 325],
  [490, 210],
] as const

const smooth = (a: number, b: number, value: number) => {
  const x = Math.max(0, Math.min(1, (value - a) / (b - a)))
  return x * x * (3 - 2 * x)
}

export function homeCycleAt(elapsed: number, duration = HOME_CYCLE_SECONDS) {
  const seconds = ((Math.max(0, elapsed) % duration) / duration) * HOME_CYCLE_SECONDS
  const phase =
    seconds < 30
      ? "initial"
      : seconds < 210
        ? "deposit"
        : seconds < 240
          ? "unstable"
          : seconds < 265
            ? "fracture"
            : seconds < 290
              ? "reform"
              : "reset"
  const restoration = 1 - smooth(265, 290, seconds)
  return {
    seconds,
    phase,
    depth: smooth(30, 210, seconds) * restoration,
    disruption: smooth(210, 260, seconds) * restoration,
    coverage: smooth(0, 30, seconds) * (0.15 + 0.85 * smooth(0, 210, seconds)) * restoration,
  }
}

// Monotonic visible time: no timers, persistence or input coupling.
export function createHomeVisitClock(now: number, visible = true, elapsed = 0) {
  let accumulated = elapsed
  let since: number | null = visible ? now : null
  return {
    read(at: number) {
      return accumulated + (since === null ? 0 : Math.max(0, at - since))
    },
    visibility(at: number, nextVisible: boolean) {
      if (since !== null) accumulated += Math.max(0, at - since)
      since = nextVisible ? at : null
    },
  }
}

// Full-bleed original, matching the existing site's centred cover projection.
export function homeImageRect(width: number, height: number) {
  const scale = Math.max(width / 1672, height / 941)
  return {
    x: (width - 1672 * scale) / 2,
    y: (height - 941 * scale) / 2,
    scale,
    width: 1672 * scale,
    height: 941 * scale,
  }
}

export function isMobileHomeClient() {
  if (/bot|crawler|spider/i.test(navigator.userAgent)) return false
  return (
    /Android|iPhone|iPad|iPod|Mobile|Tablet|Silk|Kindle/i.test(navigator.userAgent) ||
    (!/Windows/i.test(navigator.userAgent) &&
      matchMedia("(hover: none) and (pointer: coarse)").matches)
  )
}
