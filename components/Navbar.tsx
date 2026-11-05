"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  PanInfo,
} from "framer-motion"
import { siteConfig } from "../siteConfig"
import styles from "./Navbar.module.css"
import EulerBridgeMark from "./EulerBridgeMark"

const getMobileDragConstraints = () => {
  if (typeof window === "undefined") return { top: 0, bottom: 0 }
  return { top: -(window.innerHeight / 2) + 80, bottom: window.innerHeight / 2 - 80 }
}

export const navigationLinks = [
  { name: "项目", href: "/projects" },
  { name: "番剧", href: "/anime" },
  { name: "杂谈", href: "/chatter" },
  { name: "笔记", href: "/blog" },
  { name: "友链", href: "/friends" },
  { name: "关于", href: "/about" },
]

export default function Navbar({ blogHref = "/blog" }: { blogHref?: string }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const reducedMotion = useReducedMotion()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const triggerDragged = useRef(false)
  const wheelDragged = useRef(false)

  const wheelRef = useRef<HTMLDivElement>(null)
  const rawRotation = useMotionValue(0)
  const smoothRotation = useSpring(rawRotation, { stiffness: 200, damping: 25 })
  const rotation = reducedMotion ? rawRotation : smoothRotation
  const inverseRotation = useTransform(rotation, (r) => -r)

  const handlePan = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!wheelRef.current) return
    const rect = wheelRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const prevAngle = Math.atan2(
      info.point.y - info.delta.y - centerY,
      info.point.x - info.delta.x - centerX,
    )
    const currAngle = Math.atan2(info.point.y - centerY, info.point.x - centerX)
    let deltaAngle = (currAngle - prevAngle) * (180 / Math.PI)
    if (deltaAngle > 180) deltaAngle -= 360
    if (deltaAngle < -180) deltaAngle += 360
    rawRotation.set(rawRotation.get() + deltaAngle)
  }

  const dragY = useMotionValue(0)
  const [constraints, setConstraints] = useState(getMobileDragConstraints)

  useEffect(() => {
    const resize = () => {
      const next = getMobileDragConstraints()
      setConstraints(next)
      dragY.set(Math.max(next.top, Math.min(next.bottom, dragY.get())))
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false)
    }
    window.addEventListener("resize", resize)
    return () => window.removeEventListener("resize", resize)
  }, [dragY])

  useEffect(() => {
    if (!isMobileMenuOpen) return
    rawRotation.set(0)
    closeRef.current?.focus({ preventScroll: true })
    const trigger = triggerRef.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false)
      if (event.key !== "Tab") return
      const controls = dialogRef.current?.querySelectorAll<HTMLElement>("a[href], button")
      if (!controls?.length) return
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = previousOverflow
      trigger?.focus({ preventScroll: true })
    }
  }, [isMobileMenuOpen, rawRotation])

  const navLinks = navigationLinks.map((link) =>
    link.href === "/blog" ? { ...link, href: blogHref } : link,
  )
  const isCurrent = (link: (typeof navigationLinks)[number]) =>
    link.name === "笔记"
      ? pathname === "/blog" || pathname.startsWith("/blog/")
      : pathname === link.href || (link.href !== "/" && pathname.startsWith(`${link.href}/`))

  // Home owns its scoped scene navigation. Keep the existing inner-page shell.
  if (pathname === "/") return null

  return (
    <>
      <header data-field-obstacle data-site-ui className={`${styles.visualScope} ${styles.header}`}>
        <div className={styles.desktopInner}>
          <Link href="/" className={styles.brand}>
            <EulerBridgeMark className={styles.fieldMark} />
            <span>
              {siteConfig.navTitle || siteConfig.authorName}
              <span className={styles.brandAccent}>{siteConfig.navSuffix || "の"}</span>
              {siteConfig.navAfter || "宝藏之地"}
            </span>
          </Link>
          <nav aria-label="主导航" className={styles.desktopLinks}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={link.href !== "/"}
                aria-current={isCurrent(link) ? "page" : undefined}
                className={styles.desktopLink}
              >
                {link.name}
                {isCurrent(link) && (
                  <motion.span
                    className={styles.activeLine}
                    layoutId="navigation-active-line"
                    transition={{ duration: reducedMotion ? 0 : 0.3, ease: "easeInOut" }}
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 40 5" preserveAspectRatio="none" fill="none">
                      <path d="M1 4Q20 -2 39 4" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </motion.span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div className={`${styles.visualScope} ${styles.mobile}`} data-site-ui>
        <motion.button
          ref={triggerRef}
          type="button"
          aria-label="打开导航"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-nav-wheel"
          drag="y"
          dragConstraints={constraints}
          dragElastic={0.1}
          dragMomentum={false}
          style={{ y: dragY }}
          onPointerDown={() => {
            triggerDragged.current = false
          }}
          onDragStart={() => {
            triggerDragged.current = true
          }}
          onClick={(event) => {
            if (event.detail === 0 || !triggerDragged.current) setIsMobileMenuOpen(true)
          }}
          className={styles.trigger}
        >
          {!isMobileMenuOpen && <EulerBridgeMark className={styles.fieldMark} />}
        </motion.button>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.18 }}
                aria-hidden="true"
                onClick={() => setIsMobileMenuOpen(false)}
                className={styles.backdrop}
              />
              <motion.div
                ref={dialogRef}
                initial={reducedMotion ? false : { scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: reducedMotion ? 1 : 0.92, opacity: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.3, ease: "easeOut" }}
                id="mobile-nav-wheel"
                role="dialog"
                aria-modal="true"
                aria-label="移动导航"
                className={styles.wheelDialog}
              >
                <p className={styles.wheelCaption}>目录 / INDEX</p>
                <motion.div
                  ref={wheelRef}
                  style={{ rotate: rotation }}
                  onPointerDownCapture={() => {
                    wheelDragged.current = false
                  }}
                  onPanStart={() => {
                    wheelDragged.current = true
                  }}
                  onPan={handlePan}
                  onClickCapture={(event) => {
                    // A rotation gesture ending over a link must not navigate.
                    if (event.detail !== 0 && wheelDragged.current) {
                      event.preventDefault()
                      event.stopPropagation()
                    }
                  }}
                  className={styles.wheel}
                >
                  <motion.button
                    ref={closeRef}
                    type="button"
                    aria-label="关闭导航"
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{ rotate: inverseRotation }}
                    className={styles.wheelCenter}
                  >
                    <EulerBridgeMark className={styles.fieldMark} />
                    <span>关闭</span>
                  </motion.button>
                  {navLinks.map((link, index) => {
                    const angle = index * (360 / navLinks.length)
                    return (
                      <div
                        key={link.href}
                        className={styles.wheelItem}
                        style={{
                          transform: `rotate(${angle}deg) translateY(calc(var(--wheel-size) * -0.35)) rotate(${-angle}deg)`,
                        }}
                      >
                        <motion.div
                          style={{ rotate: inverseRotation }}
                          className={styles.counterRotation}
                        >
                          <Link
                            href={link.href === "/" ? "/blog" : link.href}
                            prefetch={link.href !== "/"}
                            onClick={() => setIsMobileMenuOpen(false)}
                            aria-current={isCurrent(link) ? "page" : undefined}
                            className={styles.wheelLink}
                          >
                            {link.name}
                          </Link>
                        </motion.div>
                      </div>
                    )
                  })}
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
