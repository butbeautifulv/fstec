import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["ioredis"],
  cacheMaxMemorySize: 0,
}

export default nextConfig
