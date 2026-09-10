import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/avatar",
        destination: "/avatar.jpg",
      },
    ];
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
    ];
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
};

export default nextConfig;
