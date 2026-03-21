import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Produces a minimal Node.js server in .next/standalone — required for Docker.
  output: "standalone",
  
  async rewrites() {
    return [
      // 1. Kratos public API proxy
      {
        source: "/api/.ory/:path*",
        destination: `${process.env.NEXT_PUBLIC_KRATOS_PUBLIC_URL ?? "https://auth.kleff.io"}/:path*`,
      },
      // 2. Platform API proxy
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
