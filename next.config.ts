import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Keep public site-owned images on the static/CDN path, regardless of Blob credentials.
  // Private Blob remains in use for the anime snapshot and cover APIs.
  output: process.env.HOSTING_STANDALONE === "1" ? "standalone" : undefined,
  async rewrites() {
    return [{ source: "/avatar", destination: "/avatar.jpg" }]
  },
  async headers() {
    return [
      {
        source: "/avatar",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ]
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75, 85],
    minimumCacheTTL: 86_400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1440, 1920],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
    localPatterns: [
      { pathname: "/avatar", search: "" },
      { pathname: "/avatar.jpg", search: "" },
      { pathname: "/about-cover.png", search: "" },
      { pathname: "/background.png", search: "" },
      { pathname: "/profile-studio.png", search: "" },
      { pathname: "/chatter-covers/**", search: "" },
      { pathname: "/quartz-assets/content/**", search: "" },
      { pathname: "/anime/blob/covers/**", search: "" },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bu.dusays.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lain.bgm.tv",
        pathname: "/pic/cover/**",
      },
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
        pathname: "/anime/covers/**",
      },
    ],
  },
}

export default nextConfig
