import "katex/dist/katex.min.css"
import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "../components/ThemeProvider"
import FieldScene from "../components/FieldScene"
import { MusicProvider } from "../components/MusicProvider"
import FloatingPlayer from "../components/FloatingPlayer"
import { siteConfig } from "../siteConfig"
import BackgroundSlider from "../components/BackgroundSlider"
import SplashScreen from "../components/SplashScreen"
import { FieldModeProvider } from "../components/FieldModeProvider"
import ScrollRootManager from "../components/ScrollRootManager"

import MobileBackButton from "../components/MobileBackButton"

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.bio,
  icons: {
    icon: siteConfig.faviconUrl,
    apple: siteConfig.faviconUrl,
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <style
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              #app-mount-root { opacity: 0; visibility: hidden; pointer-events: none; }
              html.splash-seen #app-mount-root { opacity: 1 !important; visibility: visible !important; pointer-events: auto !important; }
            `,
          }}
        />
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (sessionStorage.getItem('hasSeenSplash') === 'true') {
                  document.documentElement.classList.add('splash-seen');
                }
              } catch (e) {}
            `,
          }}
        />
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var themeNow = new Date();
                var savedTheme = localStorage.getItem('blog-theme');
                var overrideUntil = Number(localStorage.getItem('blog-theme-override-until'));
                var scheduledDark = themeNow.getHours() >= 18 || themeNow.getHours() < 6;
                var hasThemeOverride = (savedTheme === 'dark' || savedTheme === 'light') && overrideUntil > themeNow.getTime();
                if (hasThemeOverride ? savedTheme === 'dark' : scheduledDark) {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>

      <body className="w-screen overflow-x-hidden min-h-full flex flex-col relative transition-colors duration-1000 bg-slate-50 dark:bg-slate-950 font-serif">
        <ThemeProvider>
          <FieldModeProvider>
            <SplashScreen />

            <MusicProvider>
              <div
                id="app-mount-root"
                className="flex-1 flex flex-col transition-opacity duration-1000"
              >
                <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                  {!siteConfig.useGradient && <BackgroundSlider />}
                  <div
                    className="absolute inset-0 z-[1] bg-white/[0.12] transition-colors duration-1000 dark:bg-slate-950/25"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${siteConfig.themeColors
                        .map((color) => `${color}24`)
                        .join(", ")})`,
                    }}
                  />
                </div>

                <FieldScene />

                <ScrollRootManager />

                <div
                  id="app-scroll-root"
                  className="relative z-10 flex-1 flex flex-col"
                  data-scroll-root
                  tabIndex={-1}
                >
                  {children}
                </div>

                <div className="hidden md:block">
                  <FloatingPlayer />
                </div>

                <div className="md:hidden block">
                  <MobileBackButton />
                </div>
              </div>
            </MusicProvider>
          </FieldModeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
