import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
