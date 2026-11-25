"use client"

import { useCallback, useEffect, useId, useRef, useState } from "react"
import { getImageProps } from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { navigationLinks } from "./Navbar"
import { loadAnimeSnapshot } from "../lib/anime/client"
import { loadPaperReports } from "../lib/paper-reports-client"
import { preloadRoomAssets } from "../app/projects/room-preload"
import { isMobileHomeClient } from "../lib/home-scene"
import landscape from "../public/home-window/convict-lake-day-study.webp"
import styles from "./SplashScreen.module.css"

type Phase = "loading" | "preparing" | "exiting" | "ready"

// Authored in the existing lake photograph's coordinates. These are illustrative
// ridges and shoreline contours, not an Alpha filtration or geographic data.
const ridge =
  "M35 286 L82.2 296.4 Q94 299 104.4 303.2 L135.6 315.8 Q146 320 157.6 324.4 L192.4 337.6 Q204 342 211.2 335.4 L232.8 315.6 Q240 309 245.6 305.8 L262.4 296.2 Q268 293 275 288.2 L296 273.8 Q303 269 310.4 265.6 L332.6 255.4 Q340 252 345.4 251 L361.6 248 Q367 247 373 244.2 L391 235.8 Q397 233 402.4 232.6 L418.6 231.4 Q424 231 427.8 233.8 L439.2 242.2 Q443 245 447.2 244.2 L459.8 241.8 Q464 241 467.2 243.2 L476.8 249.8 Q480 252 485.2 252.8 L500.8 255.2 Q506 256 510.4 259 L523.6 268 Q528 271 532.4 272.8 L545.6 278.2 Q550 280 555.6 286 L572.4 304 Q578 310 583 311.6 L598 316.4 Q603 318 608.2 324.6 L623.8 344.4 Q629 351 633.2 351.8 L645.8 354.2 Q650 355 654.8 360 L669.2 375 Q674 380 679.4 383.2 L695.6 392.8 Q701 396 706 399 L721 408 Q726 411 732.8 415.8 L753.2 430.2 Q760 435 766.8 438 L787.2 447 Q794 450 801.4 451.6 L823.6 456.4 Q831 458 838 454.8 L859 445.2 Q866 442 872.4 438.2 L891.6 426.8 Q898 423 904 419.2 L922 407.8 Q928 404 932.8 402.8 L947.2 399.2 Q952 398 957.6 394.6 L974.4 384.4 Q980 381 984.4 379.8 L997.6 376.2 Q1002 375 1005.8 370.8 L1017.2 358.2 Q1021 354 1024.8 353.6 L1036.2 352.4 Q1040 352 1045.2 349 L1060.8 340 Q1066 337 1070.4 335.4 L1083.6 330.6 Q1088 329 1092.8 327.6 L1107.2 323.4 Q1112 322 1115.8 317.6 L1127.2 304.4 Q1131 300 1136.4 298.4 L1152.6 293.6 Q1158 292 1163.8 291.8 L1181.2 291.2 Q1187 291 1193 290.6 L1211 289.4 Q1217 289 1222.6 287.4 L1239.4 282.6 Q1245 281 1249.8 282.4 L1264.2 286.6 Q1269 288 1274.4 287.6 L1290.6 286.4 Q1296 286 1301 288.4 L1316 295.6 Q1321 298 1325.4 296.8 L1338.6 293.2 Q1343 292 1347.4 295.6 L1360.6 306.4 Q1365 310 1369.6 309.6 L1383.4 308.4 Q1388 308 1392.4 303.8 L1405.6 291.2 Q1410 287 1414.4 285.6 L1427.6 281.4 Q1432 280 1435.8 280 L1447.2 280 Q1451 280 1455.2 276.6 L1467.8 266.4 Q1472 263 1476.2 259.8 L1488.8 250.2 Q1493 247 1496.4 246 L1506.6 243 Q1510 242 1514.4 242.6 L1527.6 244.4 Q1532 245 1536.6 247.6 L1550.4 255.4 Q1555 258 1561.2 260 L1579.8 266 Q1586 268 1593 256.4 L1614 221.6 Q1621 210 1628.6 204.6 L1651.4 188.4 Q1659 183 1661.6 182.4 L1672 180"
const folds = [
  "M204 342 L255.2 331.6 Q268 329 278.8 321.4 L311.2 298.6 Q322 291 331 287.2 L358 275.8 Q367 272 373 264.2 L397 233 M268 329 L297.6 343.4 Q305 347 312.2 351.4 L333.8 364.6 Q341 369 349.4 372.4 L374.6 382.6 Q383 386 390.6 394.2 L413.4 418.8 Q421 427 431.2 433 L461.8 451 Q472 457 484.6 464.2 L535 493",
  "M424 231 L410.4 270.2 Q407 280 400.6 288.2 L381.4 312.8 Q375 321 370.8 328.8 L354 360 M407 280 L440.6 293.6 Q449 297 454.8 304.6 L472.2 327.4 Q478 335 482.2 339.8 L494.8 354.2 Q499 359 507.2 364.8 L531.8 382.2 Q540 388 547.6 396 L570.4 420 Q578 428 588.8 437 L621.2 464 Q632 473 644.4 480.4 L694 510",
  "M464 241 L454.4 268.2 Q452 275 457 277.4 L472 284.6 Q477 287 480.6 292.8 L495 316 M506 256 L487.6 291.2 Q483 300 489.6 308 L509.4 332 Q516 340 518.6 347.4 L526.4 369.6 Q529 377 536.6 383.2 L567 408",
  "M550 280 L534 300 Q530 305 534.4 311.4 L547.6 330.6 Q552 337 556.8 339.6 L571.2 347.4 Q576 350 577.6 356.6 L582.4 376.4 Q584 383 590.8 388.8 L611.2 406.2 Q618 412 623 420.2 L638 444.8 Q643 453 653.8 460.2 L686.2 481.8 Q697 489 708.6 494.4 L755 516",
  "M603 318 L593.4 340.4 Q591 346 596 348.8 L611 357.2 Q616 360 619.2 366.4 L632 392 M650 355 L637.2 376.6 Q634 382 639.4 388.2 L655.6 406.8 Q661 413 664.6 421 L679 453 M701 396 L697 417.6 Q696 423 703 430.8 L724 454.2 Q731 462 738.4 466 L760.6 478 Q768 482 776.6 490.6 L811 525",
  "M94 299 L132.4 338.2 Q142 348 153.6 354.4 L188.4 373.6 Q200 380 211.2 390.2 L244.8 420.8 Q256 431 272 439.8 L320 466.2 Q336 475 357 482.4 L420 504.6 Q441 512 466.8 518 L570 542 M35 331 L97.4 357.4 Q113 364 126.2 372.8 L165.8 399.2 Q179 408 193.2 417.2 L250 454",
  "M866 442 L884.4 463.6 Q889 469 897.2 472.4 L921.8 482.6 Q930 486 940 490.8 L980 510 M928 404 L948.8 426.4 Q954 432 959.6 435.4 L976.4 445.6 Q982 449 986.4 454.8 L999.6 472.2 Q1004 478 1011.2 480.4 L1040 490",
  "M1021 354 L1031.4 380.4 Q1034 387 1032.2 395 L1026.8 419 Q1025 427 1020.8 437.2 L1004 478 M1040 352 L1061.6 367.2 Q1067 371 1069.6 379.6 L1077.4 405.4 Q1080 414 1084.2 420 L1096.8 438 Q1101 444 1103.6 452 L1114 484",
  "M1112 322 L1124 345.2 Q1127 351 1125.6 360.2 L1121.4 387.8 Q1120 397 1124.6 403 L1143 427 M1158 292 L1150.8 323.2 Q1149 331 1153.6 337.4 L1167.4 356.6 Q1172 363 1169.6 372.2 L1162.4 399.8 Q1160 409 1163.2 417.4 L1176 451",
  "M1187 291 L1199 313.4 Q1202 319 1200.4 327.2 L1195.6 351.8 Q1194 360 1197.2 366.2 L1206.8 384.8 Q1210 391 1207.4 399.2 L1199.6 423.8 Q1197 432 1200.2 440.6 L1213 475 M1245 281 L1231.4 318.6 Q1228 328 1232.6 335.2 L1246.4 356.8 Q1251 364 1248.4 371.4 L1240.6 393.6 Q1238 401 1241.4 409.2 L1255 442",
  "M1296 286 L1287.2 310.8 Q1285 317 1288.8 324.6 L1300.2 347.4 Q1304 355 1302.4 363.6 L1297.6 389.4 Q1296 398 1300.2 404.4 L1312.8 423.6 Q1317 430 1319.4 440.6 L1329 483 M1343 292 L1331 330.4 Q1328 340 1330.8 346.4 L1339.2 365.6 Q1342 372 1341 381.4 L1337 419",
  "M1388 308 L1396.8 336 Q1399 343 1395.2 350.2 L1383.8 371.8 Q1380 379 1377.8 386 L1371.2 407 Q1369 414 1372.8 421 L1388 449 M1451 280 L1439 312 Q1436 320 1438.4 325.2 L1445.6 340.8 Q1448 346 1444.4 354.2 L1433.6 378.8 Q1430 387 1428.2 395.4 L1421 429",
  "M1510 242 L1498.8 277.2 Q1496 286 1501.2 290.6 L1516.8 304.4 Q1522 309 1517.4 317 L1503.6 341 Q1499 349 1496.4 357.4 L1488.6 382.6 Q1486 391 1478.6 400.2 L1456.4 427.8 Q1449 437 1441.2 445.2 L1410 478 M1555 258 L1539.8 294 Q1536 303 1538.4 308.8 L1545.6 326.2 Q1548 332 1543.6 340 L1526 372",
  "M1672 275 L1618.4 320.6 Q1605 332 1595.6 340.6 L1567.4 366.4 Q1558 375 1549.2 385.4 L1522.8 416.6 Q1514 427 1502 435.8 L1466 462.2 Q1454 471 1441 477.6 L1402 497.4 Q1389 504 1367.2 510.2 L1280 535 M1668 383 L1605.6 417.4 Q1590 426 1574 433.8 L1526 457.2 Q1510 465 1498.6 472.6 L1453 503",
]
const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason)
      return
    }
    const abort = () => {
      clearTimeout(timer)
      reject(signal.reason)
    }
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort)
      resolve()
    }, ms)
    signal.addEventListener("abort", abort, { once: true })
  })

export default function SplashScreen({ blogHref }: { blogHref: string }) {
  const [phase, setPhase] = useState<Phase>("loading")
  const [opening, setOpening] = useState<"animated" | "static" | null>(null)
  const surface = useRef<HTMLDivElement>(null)
  const maskId = useId().replace(/:/g, "")
  const router = useRouter()
  const pathname = usePathname()
  const entryPath = useRef(pathname)
  const changePhase = useCallback((next: Phase) => {
    document.documentElement.dataset.startupPhase = next
    performance.mark(`site:${next}`)
    window.dispatchEvent(new Event("site-startup-phase"))
    setPhase(next)
  }, [])
  const reveal = useCallback(() => {
    document.documentElement.classList.add("splash-seen")
    document.querySelectorAll<HTMLElement>("[data-startup-inert]").forEach((element) => {
      element.inert = false
      element.removeAttribute("data-startup-inert")
    })
    if (document.documentElement.dataset.startupPhase !== "ready") changePhase("ready")
    else setPhase("ready")
  }, [changePhase])
  const finishOpening = useRef(reveal)

  useEffect(() => {
    if (pathname !== entryPath.current) finishOpening.current()
  }, [pathname])

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    let finished = false
    let exiting = false
    let frame = 0
    let timelineTimer: number | undefined
    let deadlineTimer: number | undefined
    let readinessTimer: number | undefined
    const stop = () => {
      controller.abort()
      cancelAnimationFrame(frame)
      window.clearTimeout(timelineTimer)
      window.clearTimeout(deadlineTimer)
      window.clearTimeout(readinessTimer)
      window.removeEventListener("site-startup-phase", onPhase)
    }
    const finish = () => {
      if (finished) return
      finished = true
      stop()
      reveal()
    }
    const onPhase = () => {
      if (document.documentElement.dataset.startupPhase === "ready") finish()
    }
    finishOpening.current = finish
    window.addEventListener("site-startup-phase", onPhase)
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
    ).connection
    const constrained = connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? "")
    // Snapshot the entry route once. Soft navigation keeps this layout and
    // must not change the startup sequence or replay it.
    const homeEntry = window.location.pathname === "/"
    const mobile = isMobileHomeClient()
    if (homeEntry && mobile) {
      queueMicrotask(() => {
        if (!signal.aborted) finish()
      })
      return stop
    }
    const alreadyRevealed = document.documentElement.classList.contains("splash-seen")
    if (alreadyRevealed) {
      queueMicrotask(() => {
        if (!signal.aborted) finish()
      })
      return stop
    }

    // Router prefetch has no completion promise. It warms all navigation targets,
    // including the resolved note URL and the otherwise hidden mobile menu.
    const prefetchNavigation = async () => {
      for (const link of navigationLinks) {
        if (signal.aborted) return
        if (mobile && link.href === "/") continue
        router.prefetch(link.href === "/blog" ? blogHref : link.href)
        await sleep(constrained ? 180 : 80, signal)
      }
    }
    const warm = async () => {
      await sleep(300, signal)
      const routes = prefetchNavigation()
      if (constrained || mobile) {
        await routes
        return
      }
      const noteStyle = document.createElement("link")
      noteStyle.rel = "preload"
      noteStyle.as = "style"
      noteStyle.href = "/quartz-assets/note.css"
      document.head.appendChild(noteStyle)
      const { props } = getImageProps({
        src: "/about-cover.png",
        alt: "",
        fill: true,
        sizes: "(max-width: 767px) 95vw, 896px",
        quality: 75,
      })
      const cover = new window.Image()
      cover.decoding = "async"
      cover.fetchPriority = "low"
      cover.sizes = props.sizes ?? ""
      cover.srcset = props.srcSet ?? ""
      cover.src = props.src
      try {
        await Promise.allSettled([
          routes,
          preloadRoomAssets(),
          loadAnimeSnapshot(),
          loadPaperReports(),
          cover.decode(),
        ])
      } finally {
        noteStyle.remove()
      }
    }
    // Sidebar artwork remains warm, but does not gate the homepage handoff.
    const critical = async () => {
      const started = performance.now()
      while (performance.now() - started < 4000) {
        const roomLoading =
          document.querySelector<HTMLElement>("[data-room-status]")?.dataset.roomStatus ===
          "loading"
        const homeArtwork = document.querySelector<HTMLElement>("[data-home-artwork-kind]")?.dataset
          .homeArtwork
        const homeLoading = homeEntry && homeArtwork !== "ready" && homeArtwork !== "error"
        if (!roomLoading && !homeLoading) break
        await sleep(32, signal)
      }
      // HomeScene reports its room and exterior readiness above. Warm the
      // restored sidebar screenshots while the opening plays.
      const images = Array.from(document.images).filter((img) => {
        if (homeEntry && img.closest("[data-home-preview]")) return true
        if (!img.checkVisibility({ visibilityProperty: true, opacityProperty: true })) return false
        const rect = img.getBoundingClientRect()
        return img.loading !== "lazy" || (rect.top < innerHeight && rect.bottom > 0)
      })
      await Promise.allSettled([document.fonts.ready, ...images.map((img) => img.decode())])
    }

    const animateHome =
      homeEntry &&
      matchMedia("(min-width: 768px)").matches &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches &&
      !constrained

    const entryReady = Promise.race([critical(), sleep(4000, signal)])
    const preloads = Promise.allSettled([warm(), entryReady])

    if (homeEntry) {
      queueMicrotask(() => {
        if (signal.aborted) return
        changePhase(animateHome ? "loading" : "preparing")
        setOpening(animateHome ? "animated" : "static")
      })
      const exit = () => {
        if (signal.aborted || exiting) return
        exiting = true
        window.clearTimeout(readinessTimer)
        window.clearTimeout(deadlineTimer)
        document.querySelectorAll<HTMLElement>("#app-mount-root").forEach((element) => {
          if (element.inert) return
          element.inert = true
          element.setAttribute("data-startup-inert", "")
        })
        changePhase("exiting")
        timelineTimer = window.setTimeout(finish, animateHome ? 750 : 150)
      }
      const checkHome = () => {
        if (signal.aborted) return
        if (
          document.querySelector<HTMLElement>("[data-home-artwork-kind]")?.dataset.homeArtwork ===
          "ready"
        )
          exit()
        else readinessTimer = window.setTimeout(checkHome, 50)
      }
      const start = () => {
        if (signal.aborted) return
        // Wait for the SVG's committed first frame, not merely hydration.
        if (!surface.current?.querySelector("svg")) {
          frame = requestAnimationFrame(start)
          return
        }
        surface.current.dataset.started = "true"
        performance.mark("site:opening")
        timelineTimer = window.setTimeout(checkHome, animateHome ? 1650 : 0)
        deadlineTimer = window.setTimeout(exit, animateHome ? 4000 : 2500)
      }
      frame = requestAnimationFrame(start)
    } else {
      queueMicrotask(() => {
        if (!signal.aborted) changePhase("preparing")
      })
      // Non-home and accessibility fallbacks stay short; preload work may
      // continue without blocking the site.
      void Promise.race([
        entryPath.current === "/papers" ? entryReady : preloads,
        sleep(2500, signal),
      ])
        .then(() => {
          if (!signal.aborted) finish()
        })
        .catch(() => {
          if (!signal.aborted) finish()
        })
    }

    return () => {
      stop()
      if (exiting && !finished) reveal()
    }
  }, [blogHref, changePhase, reveal, router])

  return (
    <>
      {phase !== "ready" && (
        <div
          ref={surface}
          data-startup-overlay
          data-startup-loading
          data-opening-mode={opening ?? undefined}
          className={styles.opening}
        >
          {opening && (
            <>
              <svg className={styles.plate} viewBox="0 145 1672 780" fill="none" aria-hidden="true">
                <defs>
                  <radialGradient id={`${maskId}-wash`}>
                    <stop offset="0" stopColor="white" />
                    <stop offset=".35" stopColor="white" />
                    <stop offset=".72" stopColor="#777" />
                    <stop offset="1" stopColor="black" />
                  </radialGradient>
                  <linearGradient id={`${maskId}-water`} x2="0" y2="1">
                    <stop stopColor="white" />
                    <stop offset=".7" stopColor="#555" />
                    <stop offset="1" stopColor="black" />
                  </linearGradient>
                  <mask
                    id={`${maskId}-colour`}
                    stroke="none"
                    maskUnits="userSpaceOnUse"
                    x="0"
                    y="145"
                    width="1672"
                    height="780"
                  >
                    <ellipse cx="836" cy="546" rx="560" ry="320" fill={`url(#${maskId}-wash)`} />
                  </mask>
                  <mask
                    id={`${maskId}-reflection`}
                    stroke="none"
                    maskUnits="userSpaceOnUse"
                    x="0"
                    y="548"
                    width="1672"
                    height="360"
                  >
                    <rect x="0" y="548" width="1672" height="360" fill={`url(#${maskId}-water)`} />
                  </mask>
                  <clipPath id={`${maskId}-mountains`}>
                    <path d={`${ridge} L1672 549 L0 570 Z`} />
                  </clipPath>
                  <g id={`${maskId}-contours`}>
                    <path className={styles.ridge} d={ridge} />
                    {folds.map((d, i) => (
                      <path key={i} className={styles.fold} d={d} pathLength={1} />
                    ))}
                  </g>
                </defs>
                <g className={styles.colour} mask={`url(#${maskId}-colour)`}>
                  <image
                    href={landscape.src}
                    width="1672"
                    height="877"
                    clipPath={`url(#${maskId}-mountains)`}
                  />
                  <g mask={`url(#${maskId}-reflection)`}>
                    <image
                      href={landscape.src}
                      width="1672"
                      height="877"
                      transform="translate(0 1098) scale(1 -1)"
                      clipPath={`url(#${maskId}-mountains)`}
                    />
                  </g>
                </g>
                <use href={`#${maskId}-contours`} className={styles.mountains} />
                <g className={styles.reflection} mask={`url(#${maskId}-reflection)`}>
                  <use href={`#${maskId}-contours`} transform="translate(0 1098) scale(1 -1)" />
                </g>
                <path
                  className={styles.shore}
                  d="M28 568 Q190 551 349 553 T664 548 T991 548 T1300 545 T1648 547"
                />
                <path
                  className={styles.water}
                  d="M118 592 Q274 577 415 584 M1090 579 Q1310 571 1538 585 M274 645 419 637 M1239 630 1430 638 M631 768 722 772 M1008 735 1122 732"
                />
              </svg>
              <p className={styles.signature}>阿の宝藏之地</p>
            </>
          )}
        </div>
      )}
      {phase !== "ready" && (
        <div data-startup-overlay className={styles.actions}>
          <button type="button" onClick={() => finishOpening.current()}>
            跳过开场
          </button>
        </div>
      )}
    </>
  )
}
