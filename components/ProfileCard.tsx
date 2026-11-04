"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { loadAnimeSnapshot } from "../lib/anime/client"
import { siteConfig } from "../siteConfig"
import { useToast } from "./ToastProvider"
import styles from "./ProfileCard.module.css"

export default function ProfileCard({
  postCount,
  chatterCount,
  musicCount,
}: {
  postCount: number
  chatterCount: number
  musicCount: number
}) {
  const [animeCount, setAnimeCount] = useState<number | null>(null)
  useEffect(() => {
    let active = true
    void loadAnimeSnapshot()
      .then((snapshot) => {
        if (active) setAnimeCount(snapshot.items.length)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])
  const { showToast } = useToast()

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast(`✨ ${label}已复制到剪贴板: ${text}`, "success")
    } catch {
      showToast(`${label}复制失败，请稍后重试`, "error")
    }
  }

  return (
    <section data-field-obstacle className={styles.profile} aria-label="个人介绍">
      <Link href="/about" className={styles.about}>
        <p className={styles.eyebrow}>PERSONAL JOURNAL / 00</p>
        <div className={styles.identity}>
          <h1 className={styles.name}>{siteConfig.authorName}</h1>
          <Image
            src={siteConfig.avatarUrl}
            alt={`${siteConfig.authorName}的头像`}
            width={128}
            height={128}
            sizes="(max-width: 374px) 68px, (max-width: 767px) 80px, 96px"
            quality={85}
            className={styles.avatar}
          />
        </div>
        <p className={styles.bio}>{siteConfig.bio}</p>
        <dl className={styles.stats}>
          <StatItem count={postCount} label="笔记" />
          <StatItem count={chatterCount} label="杂谈" />
          <StatItem count={musicCount} label="音乐" />
          <StatItem count={animeCount} label="番剧" />
        </dl>
      </Link>
      <div className={styles.socials} role="group" aria-label="社交与联系">
        <SocialBtn type="github" label="在新窗口打开 GitHub" url={siteConfig.social?.github} />
        <SocialBtn
          type="email"
          label="复制邮箱"
          onClick={() => void copyToClipboard(siteConfig.social?.email || "", "邮箱")}
        />
        <SocialBtn
          type="qq"
          label="复制 QQ 号"
          onClick={() => void copyToClipboard(siteConfig.social?.qq || "", "QQ号")}
        />
        <SocialBtn
          type="wechat"
          label="复制微信号"
          onClick={() => void copyToClipboard(siteConfig.social?.wechat || "", "微信号")}
        />
      </div>
    </section>
  )
}

function StatItem({ count, label }: { count: number | null; label: string }) {
  return (
    <div className={styles.stat}>
      <dt className={styles.statLabel}>{label}</dt>
      <dd className={styles.count} title={count === null ? "数量暂未获取" : undefined}>
        {count ?? "—"}
      </dd>
    </div>
  )
}

function SocialBtn({
  type,
  label,
  url,
  onClick,
}: {
  type: "github" | "email" | "qq" | "wechat"
  label: string
  url?: string
  onClick?: () => void
}) {
  const getIcon = () => {
    switch (type) {
      case "github":
        return (
          <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
        )
      case "email":
        return (
          <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        )
      case "qq":
        return (
          <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2c-4.418 0-8 3.582-8 8 0 1.25.289 2.433.805 3.49-1.024 1.708-1.53 3.843-1.021 5.308.203.585.806.84 1.341.57.828-.418 1.625-1.025 2.296-1.722 1.335.539 2.862.854 4.579.854 1.716 0 3.243-.315 4.578-.854.671.697 1.468 1.304 2.296 1.722.535.27 1.138.015 1.341-.57.509-1.465.003-3.6-1.021-5.308C19.71 12.433 20 11.25 20 10c0-4.418-3.582-8-8-8zm-2.5 8c-.828 0-1.5-.895-1.5-2s.672-2 1.5-2 1.5.895 1.5 2-.672 2-1.5 2zm5 0c-.828 0-1.5-.895-1.5-2s.672-2 1.5-2 1.5.895 1.5 2-.672 2-1.5 2z" />
          </svg>
        )
      case "wechat":
        return (
          <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8.5 13.5c-3.59 0-6.5-2.42-6.5-5.4 0-2.98 2.91-5.4 6.5-5.4s6.5 2.42 6.5 5.4c0 2.98-2.91 5.4-6.5 5.4zm7.5 7.8c-2.76 0-5-2.02-5-4.5 0-2.48 2.24-4.5 5-4.5s5 2.02 5 4.5c0 2.48-2.24 4.5-5 4.5z" />
          </svg>
        )
      default:
        return null
    }
  }

  return url ? (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.social}
      aria-label={label}
      title={label}
    >
      {getIcon()}
    </a>
  ) : (
    <button
      type="button"
      onClick={onClick}
      className={styles.social}
      aria-label={label}
      title={label}
    >
      {getIcon()}
    </button>
  )
}
