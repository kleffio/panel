import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Produces a minimal Node.js server in .next/standalone — required for Docker.
  output: "standalone",
  
  async rewrites() {
    return [
      // 1. Auth proxy
      {
        source: "/api/auth/:path*",
        destination: `${process.env.PUBLIC_URL}/:path*`,
      },
      // 2. Platform API proxy
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
