import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
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
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
