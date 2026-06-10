import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so Next ignores stray parent-dir lockfiles.
  turbopack: { root: __dirname },
};

export default nextConfig;
