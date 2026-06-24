import type { NextConfig } from "next"
import path from "path"
import { fileURLToPath } from "url"

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const guiSrc = path.join(rootDir, "../cxado-gui/src")

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["ioredis"],
  cacheMaxMemorySize: 0,
  transpilePackages: ["@cxado/gui"],
  turbopack: {
    resolveAlias: {
      "@cxado/gui": guiSrc,
      "@cxado/gui/*": `${guiSrc}/*`,
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@cxado/gui": guiSrc,
    }
    return config
  },
}

export default nextConfig
