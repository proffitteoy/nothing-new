import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/blog/\\[\\[\\.\\.\\.path\\]\\]": ["./public/blog/**/*"],
  },
  async redirects() {
    return [
      { source: "/timeline", destination: "/legacy", permanent: false },
      { source: "/photowall", destination: "/", permanent: false },
      { source: "/moments", destination: "/", permanent: false },
      { source: "/tree", destination: "/", permanent: false },
      { source: "/posts/:path*", destination: "/legacy", permanent: false },
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
    ],
  },
};

export default nextConfig;
