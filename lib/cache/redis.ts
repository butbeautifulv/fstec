import "server-only"

import Redis from "ioredis"
import {
  getDashboardCacheTtl,
  getReferenceCacheTtl,
  isRedisEnabled,
} from "@/lib/cache/redis-config"

export { getDashboardCacheTtl, getReferenceCacheTtl, isRedisEnabled }

let client: Redis | null | undefined

function parseSentinels(raw: string) {
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [host, port = "26379"] = entry.split(":")
      return { host, port: Number(port) }
    })
}

function createRedisClient(): Redis | null {
  const url = process.env.REDIS_URL?.trim()
  if (url) {
    return new Redis(url, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    })
  }

  const sentinelsRaw = process.env.REDIS_SENTINELS?.trim()
  const masterName = process.env.REDIS_MASTER_NAME?.trim()
  if (sentinelsRaw && masterName) {
    return new Redis({
      sentinels: parseSentinels(sentinelsRaw),
      name: masterName,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    })
  }

  return null
}

export function getRedis(): Redis | null {
  if (client !== undefined) return client

  client = createRedisClient()
  if (client) {
    client.on("error", () => {
      // Redis is optional; avoid crashing the app on cache errors.
    })
  }

  return client
}

