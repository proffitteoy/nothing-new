import type { NextConfig } from "next"

const blobImagesEnabled = Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN)

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: blobImagesEnabled
        ? [
            { source: "/avatar", destination: "/assets/avatar.jpg" },
            { source: "/avatar.jpg", destination: "/assets/avatar.jpg" },
            { source: "/about-cover.png", destination: "/assets/about-cover.png" },
            { source: "/background.png", destination: "/assets/background.png" },
            { source: "/profile-studio.png", destination: "/assets/profile-studio.png" },
            {
              source: "/chatter-covers/:path*",
              destination: "/assets/chatter-covers/:path*",
            },
            {
              source: "/quartz-assets/content/:path*",
              destination: "/assets/quartz-assets/content/:path*",
            },
          ]
        : [],
      afterFiles: blobImagesEnabled
        ? []
        : [
            {
              source: "/avatar",
              destination: "/avatar.jpg",
            },
          ],
      fallback: [],
    }
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
    unoptimized: true,
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
