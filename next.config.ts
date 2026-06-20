import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      afterFiles: [
        { source: "/blog", destination: "/blog/index.html" },
        { source: "/blog/:path*", destination: "/blog/:path*/index.html" },
        { source: "/blog/:path*", destination: "/blog/:path*.html" },
      ],
    };
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
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
