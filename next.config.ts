import type { NextConfig } from "next"

const isCloudflareBuild =
  Boolean(process.env.WORKERS_CI) || process.env.NEXT_PRIVATE_STANDALONE === "true"

const nextConfig: NextConfig = {
  // Site-owned images remain on the static/CDN path.
  // Workers Builds packages OpenNext after Next; both paths need standalone output.
  output: isCloudflareBuild || process.env.HOSTING_STANDALONE === "1" ? "standalone" : undefined,
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
    // One modern format avoids duplicating AVIF/WebP cache variants.
    // Keep image optimization enabled to limit source/origin transfer.
    formats: ["image/webp"],
    qualities: [75, 85],
    // Site-owned covers and content-addressed anime images change infrequently.
    minimumCacheTTL: 2_678_400,
    // Match actual 128px avatars, 170px anime covers, ~390px cards, and
    // ~896px hero images while avoiding unnecessary transformation widths.
    deviceSizes: [640, 828, 1200, 1440, 1920],
    imageSizes: [64, 128, 256, 384],
    localPatterns: [
      { pathname: "/_next/static/media/**", search: "" },
      { pathname: "/avatar", search: "" },
      { pathname: "/avatar.jpg", search: "" },
      { pathname: "/about-cover.png", search: "" },
      { pathname: "/background.png", search: "" },
      { pathname: "/profile-studio.png", search: "" },
      { pathname: "/page-previews/*.webp", search: "" },
      { pathname: "/chatter-covers/**", search: "" },
      { pathname: "/quartz-assets/content/**", search: "" },
      { pathname: "/anime/blob/covers/**", search: "" },
      { pathname: "/assets/**", search: "" },
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
    ],
  },
}

export default nextConfig
