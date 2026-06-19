import type { Metadata } from "next"
import Script from "next/script"
import { Music2 } from "lucide-react"
import { musicTracks } from "@/lib/profile"

export const metadata: Metadata = {
  title: "音乐",
  description: "固定收录的网易云音乐播放列表。",
}

export default function MusicPage() {
  return (
    <div className="butterfly-page">
      <section className="glass-panel p-7 md:p-10">
        <p className="section-eyebrow">Music</p>
        <h1 className="mt-3 text-4xl font-semibold text-[color:var(--foreground)]">我的歌单</h1>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-[color:var(--muted)]">
          用参考站同款 APlayer / Meting 播放器加载，固定四首网易云音乐。
        </p>
      </section>

      <section className="music-grid">
        {musicTracks.map((track) => (
          <article key={track.id} className="glass-panel music-card">
            <h2 className="home-card__headline">
              <Music2 className="h-5 w-5" />
              <span>{track.title}</span>
            </h2>
            <div
              className="music-player-shell"
              dangerouslySetInnerHTML={{
                __html: `<meting-js server="netease" type="song" id="${track.id}" mode="circulation" preload="none" theme="#49b1f5"></meting-js>`,
              }}
            />
            <a className="music-origin-link" href={`https://music.163.com/#/song?id=${track.id}`}>
              打开网易云原链接
            </a>
          </article>
        ))}
      </section>

      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.css" />
      <Script src="https://cdn.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.js" strategy="afterInteractive" />
      <Script
        src="https://cdn.jsdelivr.net/npm/butterfly-extsrc@1.1.3/metingjs/dist/Meting.min.js"
        strategy="afterInteractive"
      />
    </div>
  )
}
