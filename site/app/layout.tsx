import type { Metadata } from "next"
import type { ReactNode } from "react"
import "katex/dist/katex.min.css"
import "./globals.css"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: {
    default: "李炫良 | 个人网站",
    template: "%s | 李炫良",
  },
  description: "个人网站与 Obsidian 博客主站，聚合数学笔记、数据建模项目与长期研究记录。",
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)] antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                var stored = localStorage.getItem("theme");
                document.documentElement.dataset.theme = stored || "light";
              })();
            `,
          }}
        />
        <div className="hero-spotlight fixed inset-0 -z-20" />
        <div className="grid-mask fixed inset-0 -z-10 opacity-40" />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
