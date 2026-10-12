"use client"

import { useEffect, useState } from "react"
import { ArrowUpRight, Check, Copy } from "lucide-react"
import BackButton from "../../components/BackButton"
import { friendsData } from "../../data/friends"
import { siteConfig } from "../../siteConfig"

function getAvatarFallbackText(name: string) {
  const normalizedName = name.trim()
  if (!normalizedName) return "友"

  const firstWord = normalizedName.split(/\s+/)[0]
  if (/^[A-Za-z0-9_.-]+$/.test(firstWord)) {
    return firstWord.slice(0, 5)
  }

  return Array.from(normalizedName).slice(0, 2).join("")
}

export default function FriendsBoard() {
  const [copyState, setCopyState] = useState<"idle" | "copying" | "copied" | "error">("idle")
  const [failedAvatars, setFailedAvatars] = useState<Record<string, boolean>>({})
  const applyFormat = siteConfig.friendLinkApplyFormat

  useEffect(() => {
    if (copyState !== "copied") return
    const timeout = window.setTimeout(() => setCopyState("idle"), 2000)
    return () => window.clearTimeout(timeout)
  }, [copyState])

  async function handleCopy() {
    setCopyState("copying")
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable")
      await navigator.clipboard.writeText(applyFormat)
      setCopyState("copied")
    } catch {
      setCopyState("error")
    }
  }

  return (
    <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-32 pt-24 sm:px-6 md:pt-28 lg:px-10">
      <div className="mb-8 w-max [&>button]:mb-0 [&>button]:focus-visible:ring-2 [&>button]:focus-visible:ring-indigo-500">
        <BackButton />
      </div>

      <header
        data-field-obstacle
        className="mb-8 flex flex-col gap-5 border-b border-white/60 pb-8 sm:flex-row sm:items-end sm:justify-between dark:border-white/10"
      >
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-5xl dark:text-white">
            友链
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base dark:text-slate-300">
            一些值得常去坐坐的地方。
          </p>
        </div>
        <p className="flex items-baseline gap-2 text-sm text-slate-600 dark:text-slate-300">
          <span className="text-2xl font-bold tabular-nums text-indigo-600 dark:text-indigo-300">
            {friendsData.length}
          </span>
          个朋友的站点
        </p>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-6">
        <section aria-label="朋友站点" className="min-w-0 lg:col-span-8">
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5">
            {friendsData.map((friend) => (
              <li key={friend.id} className="min-w-0">
                <a
                  data-field-obstacle
                  href={friend.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full min-w-0 flex-col rounded-3xl border border-white/60 bg-white/65 p-5 shadow-lg backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:border-indigo-300 hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 motion-reduce:transform-none sm:p-6 dark:border-white/10 dark:bg-slate-900/65 dark:hover:border-indigo-400/50 dark:hover:bg-slate-900/80 dark:focus-visible:ring-offset-slate-950"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 bg-white/80 text-center text-xs font-bold text-indigo-700 dark:bg-slate-950/60 dark:text-indigo-200"
                      style={{ borderColor: friend.themeColor }}
                    >
                      {friend.avatar && !failedAvatars[friend.id] ? (
                        // Third-party avatars retain their original source and referrer policy.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={friend.avatar}
                          alt={`${friend.name} 头像`}
                          width={56}
                          height={56}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setFailedAvatars((current) => ({ ...current, [friend.id]: true }))
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span aria-hidden="true" className="px-1">
                          {getAvatarFallbackText(friend.name)}
                        </span>
                      )}
                    </div>
                    <h2 className="min-w-0 flex-1 break-words text-lg font-bold leading-7 tracking-tight text-slate-900 transition-colors group-hover:text-indigo-700 dark:text-white dark:group-hover:text-indigo-300">
                      {friend.name}
                    </h2>
                  </div>
                  <p className="mb-5 mt-4 break-words text-sm leading-7 text-slate-700 dark:text-slate-300">
                    {friend.description}
                  </p>
                  <div className="mt-auto flex min-w-0 items-center justify-between gap-3 border-t border-slate-200/60 pt-3 text-xs leading-5 text-slate-500 dark:border-white/10 dark:text-slate-400">
                    <span className="min-w-0 break-all">
                      {new URL(friend.url).hostname.replace(/^www\./, "")}
                    </span>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-300"
                    />
                    <span className="sr-only">在新标签页打开</span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <aside
          data-field-obstacle
          aria-labelledby="friend-exchange-title"
          className="min-w-0 rounded-3xl border border-white/60 bg-white/65 p-5 shadow-lg backdrop-blur-xl sm:p-6 lg:col-span-4 dark:border-white/10 dark:bg-slate-900/65"
        >
          <h2
            id="friend-exchange-title"
            className="text-2xl font-black tracking-tight text-slate-950 dark:text-white"
          >
            交换友链
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
            欢迎交换友链。下面是本站信息，可以复制到你的友链页。
          </p>

          <h3 className="mb-3 mt-6 text-sm font-bold text-slate-800 dark:text-slate-200">
            本站信息
          </h3>
          <pre className="select-text whitespace-pre-wrap break-all rounded-2xl border border-slate-200/60 bg-white/50 p-4 font-serif text-sm leading-7 text-slate-700 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-300">
            {applyFormat}
          </pre>
          <button
            type="button"
            onClick={handleCopy}
            disabled={copyState === "copying"}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-indigo-200/70 bg-indigo-50/80 px-4 py-3 text-sm font-bold text-indigo-700 transition-colors hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 dark:border-indigo-400/20 dark:bg-indigo-500/10 dark:text-indigo-200 dark:hover:bg-indigo-500/20 dark:focus-visible:ring-offset-slate-950"
          >
            {copyState === "copied" ? (
              <Check aria-hidden="true" className="h-4 w-4" />
            ) : (
              <Copy aria-hidden="true" className="h-4 w-4" />
            )}
            {copyState === "copied"
              ? "已复制本站信息"
              : copyState === "copying"
                ? "正在复制…"
                : "复制本站信息"}
          </button>
          <p
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="mt-2 min-h-10 text-sm leading-5 text-slate-600 dark:text-slate-300"
          >
            {copyState === "error"
              ? "复制未成功，请选中上方本站信息手动复制。"
              : copyState === "copied"
                ? "本站信息已复制到剪贴板。"
                : ""}
          </p>

          <div className="mt-4 border-t border-slate-200/60 pt-6 dark:border-white/10">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">申请交换</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              请在 GitHub Issue 中填写你自己的站点名称、简介、地址和头像。
            </p>
            <a
              href={siteConfig.friendLinkIssueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:ring-offset-slate-950"
            >
              提交友链申请
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
              <span className="sr-only">在新标签页打开</span>
            </a>
          </div>
        </aside>
      </div>
    </main>
  )
}
