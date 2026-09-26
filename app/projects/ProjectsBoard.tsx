"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useReducedMotion } from "framer-motion"
import {
  ArrowUpRight,
  ArrowLeft,
  BookOpen,
  Headphones,
  List,
  LoaderCircle,
  Maximize2,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Rotate3D,
  Sun,
  X,
} from "lucide-react"
import { useTheme } from "../../components/ThemeProvider"
import { useMusic } from "../../components/MusicProvider"
import { projects, type Project, type RoomTarget } from "./projects"
import styles from "./room.module.css"

const RoomScene = dynamic(() => import("./RoomScene"), { ssr: false })

export default function ProjectsBoard() {
  const { isDark, toggleTheme } = useTheme()
  const { currentSong, isPlaying, togglePlay, musicStatus } = useMusic()
  const reducedMotion = useReducedMotion()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [staticView, setStaticView] = useState(false)
  const [sceneVersion, setSceneVersion] = useState(0)
  const [showLabels, setShowLabels] = useState(false)
  const [rotationEnabled, setRotationEnabled] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [selected, setSelected] = useState<Project | null>(null)
  const [musicOpen, setMusicOpen] = useState(false)
  const directory = useRef<HTMLDetailsElement>(null)
  const panel = useRef<HTMLElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const directoryToggle = useRef<HTMLElement>(null)
  const sceneActive = !staticView && status === "ready"
  const panelOpen = selected !== null || musicOpen

  useEffect(() => {
    if (!sceneActive) return
    document.documentElement.dataset.projectRoomActive = "true"
    return () => {
      delete document.documentElement.dataset.projectRoomActive
    }
  }, [sceneActive])
  useEffect(() => {
    if ((staticView || status === "error") && directory.current) directory.current.open = true
  }, [staticView, status])
  const closePanel = useCallback(() => {
    setSelected(null)
    setMusicOpen(false)
    requestAnimationFrame(() => {
      const target = returnFocus.current
      if (target?.isConnected && !target.hidden && !target.closest("details:not([open])"))
        target.focus({ preventScroll: true })
      else directoryToggle.current?.focus({ preventScroll: true })
    })
  }, [])
  useEffect(() => {
    if (!panelOpen) return
    panel.current?.focus({ preventScroll: true })
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        closePanel()
      }
    }
    window.addEventListener("keydown", escape)
    return () => window.removeEventListener("keydown", escape)
  }, [panelOpen, closePanel])
  const choose = useCallback(
    (target: RoomTarget) => {
      if (target === "notes" || target === "anime") {
        router.push(target === "notes" ? "/blog" : "/anime")
        return
      }
      returnFocus.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
      setMusicOpen(target === "headphones")
      setSelected(projects.find((project) => project.id === target) ?? null)
      if (directory.current) directory.current.open = false
    },
    [router],
  )
  const ready = useCallback(() => setStatus("ready"), [])
  const failed = useCallback(() => setStatus("error"), [])
  function toggleStatic() {
    closePanel()
    if (staticView || status === "error") {
      setStatus("loading")
      setSceneVersion((value) => value + 1)
      setStaticView(false)
      if (directory.current) directory.current.open = false
    } else setStaticView(true)
  }

  return (
    <main className={styles.page}>
      <section
        className={styles.stage}
        aria-labelledby="study-title"
        data-room-status={staticView ? "static" : status}
      >
        <header className={styles.heading} data-field-obstacle>
          <p className={styles.eyebrow}>
            <span /> 阿的工作台 <span className={styles.divider}>/</span> SELECTED WORK
          </p>
          <h1 id="study-title">窗边研究小屋</h1>
          <p className={styles.subtitle}>研究、构建，也持续记录。</p>
        </header>
        <div className={styles.topActions} data-field-obstacle>
          <Link href="/" className={styles.iconButton} aria-label="回到首页">
            <ArrowLeft size={18} />
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            className={styles.iconButton}
            aria-label={isDark ? "切换到日间" : "切换到夜间"}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        {/* The poster and GLB are exported from the same editable scene. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={styles.poster}
          src={`/projects-room/${isDark ? "night" : "day"}.webp`}
          width={1440}
          height={1100}
          alt="绿帘与窗边的深木工作桌，摆着三块屏幕、研究手稿和耳机，右侧是开源协作书架。"
          data-visible={!sceneActive}
          fetchPriority="high"
        />
        {!staticView && status !== "error" && (
          <RoomScene
            key={sceneVersion}
            isDark={isDark}
            reduceMotion={!!reducedMotion}
            rotationEnabled={rotationEnabled}
            paused={panelOpen}
            resetKey={resetKey}
            showLabels={showLabels}
            onReady={ready}
            onError={failed}
            onChoose={choose}
          />
        )}
        <div className={styles.caption} data-field-obstacle>
          <span className={styles.captionLine} />
          <p>
            问题写在纸上，
            <br />
            想法在这里慢慢成形。
          </p>
          <small>数学研究 · 工具建设 · 开源协作</small>
        </div>
        <div className={styles.toolbar} data-field-obstacle>
          <details ref={directory} className={styles.directory}>
            <summary ref={directoryToggle} className={styles.directoryToggle}>
              <List size={16} /> 项目目录 <span>06</span>
            </summary>
            <div className={styles.directoryBody} data-field-obstacle>
              {[false, true].map((contribution) => (
                <section
                  key={String(contribution)}
                  aria-label={contribution ? "开源贡献" : "代表作品"}
                >
                  <h2>{contribution ? "02 / 开源贡献" : "01 / 代表作品"}</h2>
                  {projects
                    .filter((project) => project.contribution === contribution)
                    .map((project) => (
                      <article className={styles.directoryRow} key={project.id}>
                        <button type="button" onClick={() => choose(project.id)}>
                          <strong>{project.label}</strong>
                          <small>{project.object}</small>
                        </button>
                        <a
                          href={project.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${project.name} GitHub 仓库`}
                        >
                          <ArrowUpRight size={17} />
                        </a>
                        <p>{project.description}</p>
                      </article>
                    ))}
                </section>
              ))}
              <div className={styles.directoryLife}>
                <Link href="/blog">笔记</Link>
                <Link href="/music">音乐</Link>
                <Link href="/anime">番剧</Link>
              </div>
            </div>
          </details>
          <div className={styles.sceneTools}>
            <button
              type="button"
              disabled={!sceneActive || panelOpen}
              aria-label="回到桌前"
              onClick={() => setResetKey((key) => key + 1)}
            >
              <RotateCcw size={15} aria-hidden="true" />
              <span>回到桌前</span>
            </button>
            <button
              type="button"
              disabled={!sceneActive || panelOpen}
              aria-pressed={showLabels}
              onClick={() => setShowLabels((value) => !value)}
            >
              <Maximize2 size={15} />
              <span>{showLabels ? "收起入口" : "显示入口"}</span>
            </button>
            <button
              type="button"
              className={styles.rotateButton}
              disabled={!sceneActive || panelOpen}
              aria-pressed={rotationEnabled}
              onClick={() => setRotationEnabled((value) => !value)}
            >
              <Rotate3D size={15} />
              <span>{rotationEnabled ? "结束旋转" : "旋转"}</span>
            </button>
          </div>
          <button type="button" className={styles.staticButton} onClick={toggleStatic}>
            {staticView || status === "error" ? "进入 3D" : "静态浏览"}
          </button>
        </div>
        <p className={styles.hint} role="status">
          {status === "loading" && !staticView ? (
            <>
              <LoaderCircle size={13} className={styles.spinner} />
              正在布置小屋 · 项目目录已可浏览
            </>
          ) : status === "error" ? (
            "小屋暂未加载，项目目录仍可浏览。"
          ) : staticView ? (
            "静静看看，或从项目目录展开阅读。"
          ) : (
            <>
              <span className={styles.desktopHint}>拖动环绕 · 滚轮缩放 · 点击物件</span>
              <span className={styles.mobileHint}>
                {rotationEnabled
                  ? "单指环绕 · 双指缩放 · 结束旋转后可滚动"
                  : "点击物件探索 · 点「旋转」环绕小屋"}
              </span>
            </>
          )}
        </p>
        {panelOpen && (
          <aside
            ref={panel}
            className={styles.panel}
            role="dialog"
            aria-modal="false"
            aria-labelledby="room-detail-title"
            tabIndex={-1}
            data-field-obstacle
          >
            <button
              type="button"
              className={styles.close}
              onClick={closePanel}
              aria-label="关闭详情"
            >
              <X size={20} />
            </button>
            {selected ? (
              <>
                <p className={styles.eyebrow}>
                  {selected.contribution ? "OPEN SOURCE / 协作" : "SELECTED WORK / 项目"}
                </p>
                <div className={styles.detailIllustration} aria-hidden="true">
                  <BookOpen size={48} strokeWidth={1} />
                  <span>{String(projects.indexOf(selected) + 1).padStart(2, "0")}</span>
                  <small>{selected.object}</small>
                </div>
                <p className={styles.category}>{selected.category}</p>
                <h2 id="room-detail-title">{selected.name}</h2>
                <p className={styles.description}>{selected.description}</p>
                <ul className={styles.tags} aria-label="技术标签">
                  {selected.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
                {selected.contribution && (
                  <p className={styles.contributionNote}>
                    这里记录我参与的工作，完整项目由上游社区维护。
                  </p>
                )}
                <a
                  className={styles.primaryLink}
                  href={selected.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {selected.contribution ? "查看上游仓库" : "打开项目仓库"}
                  <ArrowUpRight size={17} />
                </a>
                <p className={styles.panelFoot}>窗边的一项工作 · 持续记录中</p>
              </>
            ) : (
              <>
                <p className={styles.eyebrow}>BETWEEN THE LINES / 日常</p>
                <div className={styles.detailIllustration} aria-hidden="true">
                  <Headphones size={58} strokeWidth={1} />
                </div>
                <h2 id="room-detail-title">桌边的音乐</h2>
                <p className={styles.description}>
                  {currentSong?.name || currentSong?.title || "挑一首歌，陪伴这一会儿。"}
                </p>
                <p className={styles.category}>
                  {currentSong?.artist || currentSong?.author || "与全站播放器同步"}
                </p>
                {musicStatus === "ready" && (
                  <button type="button" className={styles.primaryLink} onClick={togglePlay}>
                    {isPlaying ? <Pause size={17} /> : <Play size={17} />}
                    {isPlaying ? "暂停播放" : "继续播放"}
                  </button>
                )}
                <Link href="/music" className={styles.textLink}>
                  前往音乐页
                  <ArrowUpRight size={15} />
                </Link>
              </>
            )}
          </aside>
        )}
      </section>
    </main>
  )
}
