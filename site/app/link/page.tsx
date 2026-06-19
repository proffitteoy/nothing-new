import type { Metadata } from "next"
import { Link2 } from "lucide-react"
import { friendLinks } from "@/lib/profile"

export const metadata: Metadata = {
  title: "友链",
  description: "友情链接。",
}

export default function LinkPage() {
  return (
    <div className="butterfly-page">
      <section className="glass-panel p-7 md:p-10">
        <p className="section-eyebrow">Friends</p>
        <h1 className="mt-3 text-4xl font-semibold text-[color:var(--foreground)]">友情链接</h1>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-[color:var(--muted)]">
          保持参考站的友链卡片样式，后续新增友链只需要补数据。
        </p>
      </section>

      <section className="friend-grid">
        {friendLinks.map((friend) => (
          <a key={friend.href} href={friend.href} className="friend-card">
            <div className="friend-card__cover">
              <img src={friend.cover} alt="" />
            </div>
            <div className="friend-card__info">
              <img src={friend.avatar} alt={`${friend.title} 头像`} />
              <span>
                <strong>{friend.title}</strong>
                <small>{friend.description}</small>
              </span>
              <Link2 className="h-4 w-4" />
            </div>
          </a>
        ))}
      </section>
    </div>
  )
}
