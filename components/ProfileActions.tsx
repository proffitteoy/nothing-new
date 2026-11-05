"use client"

import { siteConfig } from "../siteConfig"
import { useToast } from "./ToastProvider"
import styles from "./ProfileActions.module.css"

// Content only: #67 owns the slot, trigger, expanded bounds and dismissal.
export default function ProfileActions() {
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
    <div className={styles.actions} role="group" aria-label="关于与联系">
      <a className={styles.action} href="/about">
        关于我
      </a>
      <a
        className={styles.action}
        href={siteConfig.social.github}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="在新窗口打开 GitHub"
      >
        GitHub
      </a>
      {[
        ["邮箱", siteConfig.social.email],
        ["QQ号", siteConfig.social.qq],
        ["微信号", siteConfig.social.wechat],
      ].map(([label, value]) => (
        <button
          key={label}
          type="button"
          className={styles.action}
          aria-label={`复制${label}`}
          onClick={() => void copyToClipboard(value, label)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
