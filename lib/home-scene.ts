export const HOME_CYCLE_SECONDS = 300

// Exponential damping has the same response at different display refresh rates.
export function dampWorldProgress(current: number, target: number, seconds: number) {
  const next = current + (target - current) * -Math.expm1(-10 * Math.max(0, seconds))
  return Math.abs(next - target) < 0.00001 ? target : next
}

// One native scroll axis: room (-1), window (0), landscape (+1).
export function homeProjectProgress(top: number, height: number) {
  return Math.max(-1, Math.min(1, top / Math.max(1, height) / 2 - 1))
}
export function homeProjectScroll(progress: number, height: number) {
  return (2 + 2 * Math.max(-1, Math.min(1, progress))) * Math.max(1, height)
}
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

// Measured from the room asset alpha, not independent CSS offsets.
export const HOME_ROOM = {
  width: 1585,
  height: 992,
  frame: [95, 43, 1397, 753],
  opening: [197, 126, 1193, 611],
  sillCenterY: 775,
} as const
export const HOME_LAKE = { width: 1672, height: 877 } as const

// Source-image coordinates: grow a valley-centred opening along the ridge,
// advancing into the mountain/lake before opening the sky above it.
export function homeOpeningRevealPath(progress: number, ridge: readonly number[][]) {
  const p = Math.max(0, Math.min(1, progress))
  const smooth = (t: number) => t * t * (3 - 2 * t)
  const center = HOME_LAKE.width / 2
  const halfWidth = 8 + HOME_LAKE.width * 0.59 * smooth(p)
  const left = Math.max(-48, center - halfWidth)
  const right = Math.min(HOME_LAKE.width + 48, center + halfWidth)
  const late = Math.max(0, (p - 0.65) / 0.35)
  const down = 820 * p ** 1.55 + 520 * smooth(late)
  const up = 540 * Math.max(0, (p - 0.35) / 0.65) ** 1.8
  const ridgeAt = (x: number) => {
    if (x <= ridge[0][0]) return ridge[0][1]
    for (let i = 1; i < ridge.length; i++) {
      const [a, b] = [ridge[i - 1], ridge[i]]
      if (x <= b[0]) return a[1] + ((x - a[0]) / (b[0] - a[0])) * (b[1] - a[1])
    }
    return ridge[ridge.length - 1][1]
  }
  const xs = [
    ...new Set([
      left,
      right,
      ...ridge.map(([x]) => x).filter((x) => x > left && x < right),
      ...Array.from({ length: 71 }, (_, i) => i * 24).filter((x) => x > left && x < right),
    ]),
  ].sort((a, b) => a - b)
  const top: number[][] = [],
    bottom: number[][] = []
  for (const x of xs) {
    const spread = Math.sqrt(Math.max(0, 1 - ((x - center) / halfWidth) ** 2))
    const base = ridgeAt(x) + 24
    top.push([x, Math.max(-48, base - up * spread)])
    bottom.push([x, Math.min(HOME_LAKE.height + 48, base + down * spread)])
  }
  return `M${[...top, ...bottom.reverse()].map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(" L")} Z`
}

export function homeWindowProjection(width: number, height: number) {
  const [frameX, frameY, frameWidth, frameHeight] = HOME_ROOM.frame
  // Keep a little wall above the complete frame, even on short or wide desktops.
  const scale = Math.min(
    Math.max(width / HOME_ROOM.width, height / HOME_ROOM.height),
    Math.max(1, width - 32) / frameWidth,
    Math.max(1, height - 80) / frameHeight,
  )
  const room = {
    x: width / 2 - (frameX + frameWidth / 2) * scale,
    y: Math.max((height - HOME_ROOM.height * scale) / 2, 24 - frameY * scale),
    width: HOME_ROOM.width * scale,
    height: HOME_ROOM.height * scale,
  }
  const [x, y, w, h] = HOME_ROOM.opening
  const opening = {
    x: room.x + (x / HOME_ROOM.width) * room.width,
    y: room.y + (y / HOME_ROOM.height) * room.height,
    width: (w / HOME_ROOM.width) * room.width,
    height: (h / HOME_ROOM.height) * room.height,
  }
  const lakeScale = Math.max(
    (opening.width + 64) / HOME_LAKE.width,
    (opening.height + 64) / HOME_LAKE.height,
  )
  const lake = {
    x: opening.x + (opening.width - HOME_LAKE.width * lakeScale) / 2,
    y: opening.y + (opening.height - HOME_LAKE.height * lakeScale) / 2,
    width: HOME_LAKE.width * lakeScale,
    height: HOME_LAKE.height * lakeScale,
  }
  return { room, opening, lake }
}

// A fixed aperture at 2m, exterior reference plane at 20m; only the viewpoint moves.
// All exterior pixels (including water) use this one off-axis projection.
export function homeWindowLook(x: number, y: number, openingHeight: number) {
  const focal = openingHeight * 1.1
  const travel = 0.045 * (1 / 2 - 1 / 20) * focal
  return {
    x: Math.max(-1, Math.min(1, x)) * travel,
    y: Math.max(-1, Math.min(1, y)) * travel * 0.7,
  }
}
