"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowDown, ArrowUpRight, Check, Copy, Eye, RotateCw, X } from "lucide-react"
import BackButton from "../../components/BackButton"
import { friendsData, type Friend } from "../../data/friends"
import { siteConfig } from "../../siteConfig"
import styles from "./FriendsBoard.module.css"

type AvatarFallback = "site" | "text"

function getAvatarFallbackText(name: string) {
  const normalizedName = name.trim()
  if (!normalizedName) return "友"
  const firstWord = normalizedName.split(/\s+/)[0]
  if (/^[A-Za-z0-9_.-]+$/.test(firstWord)) return firstWord.slice(0, 5)
  return Array.from(normalizedName).slice(0, 2).join("")
}

export default function FriendsBoard() {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copying" | "copied" | "error">("idle")
  const [avatarFallbacks, setAvatarFallbacks] = useState<Record<string, AvatarFallback>>({})
  const [preview, setPreview] = useState<{
    friend: Friend
    status: "loading" | "ready" | "error"
    attempt: number
  } | null>(null)
  const formatRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const anchorRef = useRef<HTMLLIElement>(null)
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipFocus = useRef(false)
  const focusPreview = useRef(false)
  const applyFormat = siteConfig.friendLinkApplyFormat
  const fallbackAvatar = siteConfig.avatarUrl
  const previewId = preview?.friend.id
  const previewAttempt = preview?.attempt

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }
  const scheduleClose = () => {
    if (openTimer.current) clearTimeout(openTimer.current)
    cancelClose()
    if (previewRef.current?.contains(document.activeElement)) return
    closeTimer.current = setTimeout(() => setPreview(null), 220)
  }
  const closePreview = () => {
    if (openTimer.current) clearTimeout(openTimer.current)
    cancelClose()
    setPreview(null)
    skipFocus.current = true
    anchorRef.current?.querySelector<HTMLAnchorElement>("a")?.focus({ preventScroll: true })
    skipFocus.current = false
  }
  const openPreview = (friend: Friend, anchor: HTMLLIElement, delay = 0) => {
    if (skipFocus.current) return
    if (openTimer.current) clearTimeout(openTimer.current)
    cancelClose()
    anchorRef.current = anchor
    openTimer.current = setTimeout(() => {
      setPreview((current) =>
        current?.friend.id === friend.id
          ? current
          : {
              friend,
              status: "loading",
              attempt: 0,
            },
      )
    }, delay)
  }

  useEffect(
    () => () => {
      if (openTimer.current) clearTimeout(openTimer.current)
      if (closeTimer.current) clearTimeout(closeTimer.current)
    },
    [],
  )

  useEffect(() => {
    if (!previewId) return
    if (focusPreview.current) {
      previewRef.current?.querySelector<HTMLButtonElement>("button")?.focus()
      focusPreview.current = false
    }
    const timeout = setTimeout(
      () =>
        setPreview((current) =>
          current?.status === "loading" ? { ...current, status: "error" } : current,
        ),
      12000,
    )
    const dismiss = () => {
      if (openTimer.current) clearTimeout(openTimer.current)
      if (closeTimer.current) clearTimeout(closeTimer.current)
      setPreview(null)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      event.preventDefault()
      setPreview(null)
      skipFocus.current = true
      anchorRef.current?.querySelector<HTMLAnchorElement>("a")?.focus({ preventScroll: true })
      skipFocus.current = false
    }
    const outside = (event: PointerEvent) => {
      if (
        !previewRef.current?.contains(event.target as Node) &&
        !anchorRef.current?.contains(event.target as Node)
      )
        dismiss()
    }
    const scroll = (event: Event) => {
      if (event.target instanceof Node && previewRef.current?.contains(event.target)) return
      dismiss()
    }
    window.addEventListener("keydown", escape)
    window.addEventListener("pointerdown", outside)
    window.addEventListener("resize", dismiss)
    window.addEventListener("scroll", scroll, true)
    return () => {
      clearTimeout(timeout)
      window.removeEventListener("keydown", escape)
      window.removeEventListener("pointerdown", outside)
      window.removeEventListener("resize", dismiss)
      window.removeEventListener("scroll", scroll, true)
    }
  }, [previewId, previewAttempt])

  const handleCopy = async () => {
    setCopyStatus("copying")
    try {
      await navigator.clipboard.writeText(applyFormat)
      setCopyStatus("copied")
    } catch {
      setCopyStatus("error")
      formatRef.current?.focus()
      formatRef.current?.select()
    }
  }

  const previewWindow = preview && (
    <div
      id="friend-homepage-preview"
      ref={previewRef}
      className={styles.preview}
      role="dialog"
      aria-label={`${preview.friend.name}首页预览`}
      onPointerEnter={cancelClose}
      onPointerLeave={scheduleClose}
      onFocusCapture={cancelClose}
      onBlurCapture={(event) => {
        if (
          !event.currentTarget.contains(event.relatedTarget as Node) &&
          !anchorRef.current?.contains(event.relatedTarget as Node)
        )
          scheduleClose()
      }}
    >
      <div className={styles.previewHeader}>
        <span className={styles.windowDots} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>{new URL(preview.friend.url).hostname}</span>
        <button type="button" onClick={closePreview} aria-label="关闭首页预览">
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <div className={styles.previewImage} aria-busy={preview.status === "loading"}>
        {preview.status === "loading" && (
          <p role="status">
            <span className={styles.spinner} aria-hidden="true" />
            正在加载首页预览…
          </p>
        )}
        {preview.status === "error" && (
          <div className={styles.previewError}>
            <p role="status">首页预览暂时无法加载</p>
            <button
              type="button"
              onClick={() =>
                setPreview({ ...preview, status: "loading", attempt: preview.attempt + 1 })
              }
            >
              <RotateCw size={14} aria-hidden="true" />
              重试
            </button>
          </div>
        )}
        {/* A snapshot is requested only after intentional hover, focus or an explicit touch action. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={`${preview.friend.id}-${preview.attempt}`}
          src={`/friends-previews/${encodeURIComponent(preview.friend.id)}.jpg${preview.attempt ? `?retry=${preview.attempt}` : ""}`}
          alt={`${preview.friend.name}网站首页快照`}
          width={1200}
          height={900}
          decoding="async"
          className={preview.status === "ready" ? styles.previewReady : styles.previewPending}
          onLoad={() =>
            setPreview((current) =>
              current?.friend.id === preview.friend.id && current.attempt === preview.attempt
                ? { ...current, status: "ready" }
                : current,
            )
          }
          onError={() =>
            setPreview((current) =>
              current?.friend.id === preview.friend.id && current.attempt === preview.attempt
                ? { ...current, status: "error" }
                : current,
            )
          }
        />
      </div>
      <div className={styles.previewFooter}>
        <div>
          <strong>{preview.friend.name}</strong>
          <span>首页快照</span>
        </div>
        <a href={preview.friend.url} target="_blank" rel="noopener noreferrer">
          打开网站 <ArrowUpRight size={15} aria-hidden="true" />
          <span className="sr-only">（新窗口打开）</span>
        </a>
      </div>
    </div>
  )

  return (
    <main className={styles.board}>
      <div className={styles.inner}>
        <div className={styles.back}>
          <BackButton />
        </div>
        <header className={styles.intro} data-field-obstacle>
          <div>
            <p className={styles.eyebrow}>FRIENDS / 友链</p>
            <h1>云端引力</h1>
            <p className={styles.subtitle}>那些散落在赛博宇宙各处的有趣灵魂与神经节点。</p>
          </div>
          <a href="#friend-application" className={styles.textLink}>
            交换友链 <ArrowDown size={16} aria-hidden="true" />
          </a>
        </header>
        <section aria-labelledby="friends-directory-title">
          <div className={styles.sectionHeading}>
            <h2 id="friends-directory-title">
              友链名录 <span>{friendsData.length}</span>
            </h2>
            <p>
              悬停或点击 <Eye size={14} aria-hidden="true" /> 预览对方首页
            </p>
          </div>
          <ol className={styles.list}>
            {friendsData.map((friend) => {
              const avatarFallback = avatarFallbacks[friend.id]
              const avatarSrc =
                avatarFallback === "site" ? fallbackAvatar : friend.avatar || fallbackAvatar
              const failAvatar = () =>
                setAvatarFallbacks((current) => {
                  if (current[friend.id] !== avatarFallback) return current
                  return {
                    ...current,
                    [friend.id]:
                      avatarFallback === undefined && friend.avatar && fallbackAvatar
                        ? "site"
                        : "text",
                  }
                })
              return (
                <li
                  key={friend.id}
                  className={styles.friendRow}
                  onPointerEnter={(event) => {
                    if (event.pointerType === "mouse") openPreview(friend, event.currentTarget, 250)
                  }}
                  onPointerLeave={scheduleClose}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") closePreview()
                    if (event.key === "ArrowDown" && preview?.friend.id === friend.id) {
                      event.preventDefault()
                      previewRef.current?.querySelector<HTMLButtonElement>("button")?.focus()
                    }
                  }}
                  onFocusCapture={(event) => {
                    if (event.target.tagName === "A") openPreview(friend, event.currentTarget)
                  }}
                  onBlurCapture={(event) => {
                    if (
                      !event.currentTarget.contains(event.relatedTarget as Node) &&
                      !previewRef.current?.contains(event.relatedTarget as Node)
                    )
                      scheduleClose()
                  }}
                >
                  <a
                    data-field-obstacle
                    href={friend.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.friend}
                  >
                    <span className={styles.avatar}>
                      {avatarSrc && avatarFallback !== "text" ? (
                        // External avatar hosts retain native images and their two-stage fallback.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarSrc}
                          alt={`${friend.name} 头像`}
                          width={48}
                          height={48}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          ref={(image) => {
                            // A cached failure can finish before React attaches onError.
                            if (image?.complete && image.naturalWidth === 0) failAvatar()
                          }}
                          onError={(event) => {
                            if (
                              event.currentTarget.complete &&
                              event.currentTarget.naturalWidth === 0
                            )
                              failAvatar()
                          }}
                        />
                      ) : (
                        <span aria-hidden="true">{getAvatarFallbackText(friend.name)}</span>
                      )}
                    </span>
                    <div className={styles.friendContent}>
                      <h3>{friend.name}</h3>
                      <p className={styles.description}>{friend.description}</p>
                    </div>
                    <span className="sr-only">（新窗口打开）</span>
                  </a>
                  <button
                    type="button"
                    className={styles.previewToggle}
                    aria-haspopup="dialog"
                    tabIndex={preview?.friend.id === friend.id ? -1 : 0}
                    aria-label={`预览${friend.name}的首页`}
                    aria-expanded={preview?.friend.id === friend.id}
                    aria-controls={
                      preview?.friend.id === friend.id ? "friend-homepage-preview" : undefined
                    }
                    onClick={(event) => {
                      if (preview?.friend.id === friend.id) closePreview()
                      else {
                        focusPreview.current = event.detail === 0
                        openPreview(friend, event.currentTarget.closest("li")!)
                      }
                    }}
                  >
                    <Eye size={16} aria-hidden="true" />
                  </button>
                  {preview?.friend.id === friend.id && previewWindow}
                </li>
              )
            })}
          </ol>
        </section>
        <section
          id="friend-application"
          aria-labelledby="friend-application-title"
          className={styles.application}
          data-field-obstacle
        >
          <div className={styles.applicationNote}>
            <p className={styles.eyebrow}>EXCHANGE / 建立连接</p>
            <h2 id="friend-application-title">交换友链</h2>
            <p>
              欢迎交换友链。复制下方本站信息，
              <br />
              再通过 GitHub Issue 留下你的站点信息。
            </p>
            <a
              href={siteConfig.friendLinkIssueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.applyLink}
            >
              提交友链申请 <ArrowUpRight size={18} aria-hidden="true" />
              <span className="sr-only">（新窗口打开）</span>
            </a>
          </div>
          <div className={styles.format}>
            <div className={styles.formatHeading}>
              <label htmlFor="friend-apply-format">本站名片</label>
              <button type="button" onClick={handleCopy} disabled={copyStatus === "copying"}>
                {copyStatus === "copied" ? (
                  <Check size={16} aria-hidden="true" />
                ) : (
                  <Copy size={16} aria-hidden="true" />
                )}
                {copyStatus === "copied"
                  ? "已复制"
                  : copyStatus === "copying"
                    ? "复制中…"
                    : "复制申请格式"}
              </button>
            </div>
            <textarea
              id="friend-apply-format"
              ref={formatRef}
              readOnly
              value={applyFormat}
              rows={6}
              spellCheck={false}
              aria-describedby="friend-copy-status"
            />
            <p id="friend-copy-status" role="status" className={styles.copyStatus}>
              {copyStatus === "error"
                ? "未能复制，已选中名片内容，请手动复制。"
                : copyStatus === "copied"
                  ? "名片已复制，可以前往 GitHub 提交申请。"
                  : "复制本站信息，申请仍通过 GitHub Issue 提交。"}
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
