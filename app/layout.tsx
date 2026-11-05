import "katex/dist/katex.min.css"
import { getBlogEntryRoute } from "../lib/notes/server"
import type { Metadata } from "next"
import "./globals.css"
import { FieldModeProvider } from "../components/FieldModeProvider"
import SiteDisplayControls from "../components/SiteDisplayControls"
import { ThemeProvider } from "../components/ThemeProvider"
import { MusicProvider } from "../components/MusicProvider"
import { siteConfig } from "../siteConfig"
import BackgroundSlider from "../components/BackgroundSlider"
import SplashScreen from "../components/SplashScreen"
import ScrollRootManager from "../components/ScrollRootManager"
import Navbar from "../components/Navbar"

import MobileBackButton from "../components/MobileBackButton"

export const metadata: Metadata = {
  metadataBase: new URL("https://nothing-new.cn"),
  title: siteConfig.title,
  description: siteConfig.bio,
  icons: {
    icon: siteConfig.faviconUrl,
    apple: siteConfig.faviconUrl,
  },
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const blogHref = await getBlogEntryRoute()
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <style
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              html.splash-seen [data-startup-overlay] { display: none; }
              html[data-startup-entry="page"] [data-startup-loading] { display: none; }
              html:not(.splash-seen) [data-site-ui] { opacity: 0; visibility: hidden; pointer-events: none; }
            `,
          }}
        />
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              // Decide before hydration so subpage refreshes never flash the avatar intro.
              document.documentElement.dataset.startupEntry = location.pathname === '/' ? 'home' : 'page';
              document.documentElement.dataset.startupPhase = location.pathname === '/' ? 'loading' : 'preparing';
              // Fail open if hydration or the animation fails; allow 7.4s animation and at most 10s logo hold.
              window.setTimeout(function () { if (document.documentElement.classList.contains('splash-seen')) return; document.documentElement.classList.add('splash-seen'); document.documentElement.dataset.startupPhase = 'ready'; window.dispatchEvent(new Event('site-startup-phase')); }, 22000);
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
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
          if (location.pathname === '/') {
            var mobileHome = !/bot|crawler|spider/i.test(navigator.userAgent) &&
              (/Android|iPhone|iPad|iPod|Mobile|Tablet|Silk|Kindle/i.test(navigator.userAgent) ||
              (!/Windows/i.test(navigator.userAgent) && matchMedia('(hover: none) and (pointer: coarse)').matches));
            if (mobileHome) {
              document.documentElement.dataset.homeDevice = 'mobile';
              location.replace('/blog');
            } else {
              var homeElapsed = 0;
              var homeSince = document.hidden ? null : performance.now();
              var homeVisibility = function (at, visible) {
                if (homeSince !== null) homeElapsed += Math.max(0, at - homeSince);
                homeSince = visible ? at : null;
              };
              var homeVisibilityListener = function () { homeVisibility(performance.now(), !document.hidden); };
              document.addEventListener('visibilitychange', homeVisibilityListener);
              window.__homeVisitClock = {
                read: function (at) { return homeElapsed + (homeSince === null ? 0 : Math.max(0, at - homeSince)); },
                visibility: homeVisibility,
                stop: function () { document.removeEventListener('visibilitychange', homeVisibilityListener); }
              };
            }
          }
        `,
          }}
        />
        <noscript>
          <style>{`[data-startup-overlay] { display: none !important; } [data-site-ui] { opacity: 1 !important; visibility: visible !important; pointer-events: auto !important; }`}</style>
        </noscript>
      </head>

      <body className="w-screen overflow-x-hidden min-h-full flex flex-col relative transition-colors duration-1000 bg-slate-50 dark:bg-slate-950 font-serif">
        <ThemeProvider>
          <FieldModeProvider>
            <SplashScreen blogHref={blogHref} />

            <MusicProvider>
              <div
                id="app-mount-root"
                className="flex-1 flex flex-col transition-opacity duration-1000"
              >
                <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                  {!siteConfig.useGradient && <BackgroundSlider />}
                </div>

                <Navbar blogHref={blogHref} />
                <ScrollRootManager />
                <SiteDisplayControls />

                <div
                  id="app-scroll-root"
                  className="relative z-10 flex-1 flex flex-col"
                  data-scroll-root
                  data-site-ui
                >
                  {children}
                </div>

                <div className="md:hidden block" data-site-ui>
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
