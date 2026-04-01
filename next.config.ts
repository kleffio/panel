import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@kleffio/ui", "@kleffio/plugin-components", "@kleffio/sdk"],
  // Produces a minimal Node.js server in .next/standalone — required for Docker.
  output: "standalone",
  
  async redirects() {
    return [
      {
        source: "/sso/self-service/login/browser",
        destination: "/auth/sso/login",
        permanent: false,
      },
      {
        source: "/auth-consent",
        destination: "/hydra-consent",
        permanent: false,
      },
    ];
  },

  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!apiBase) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${apiBase}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
