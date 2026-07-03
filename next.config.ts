import path from "node:path";
import type { NextConfig } from "next";

// Backend origin the browser talks to *through* this app (avoids CORS): the
// browser calls same-origin `/api/backend/*` and Next proxies to the backend.
const BACKEND_ORIGIN =
  process.env.BACKEND_ORIGIN ?? "https://azi-backend-preview.fly.dev";

const nextConfig: NextConfig = {
  // Lean, self-contained server bundle for Docker/Fly (`.next/standalone`).
  output: "standalone",
  // Pin the workspace root to this project (a stray lockfile in $HOME otherwise
  // makes Next guess the wrong root for file tracing / env loading).
  turbopack: {
    root: path.resolve(__dirname),
  },
  // MUI is a large package; let Next optimize barrel imports.
  experimental: {
    optimizePackageImports: ["@mui/material", "@mui/icons-material"],
  },
  // Same-origin proxy to the backend monorepo (server-side; bypasses browser CORS).
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${BACKEND_ORIGIN}/:path*`,
      },
    ];
  },
};

export default nextConfig;
