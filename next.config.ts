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
    // API_BASE_URL is the server-side (container-to-container) address.
    // NEXT_PUBLIC_API_BASE_URL is the browser-side address baked at build time.
    // Inside Docker the server-side rewrite must use the Docker network hostname
    // (e.g. http://api:8080), not localhost which points to the panel container.
    const apiBase = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
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
