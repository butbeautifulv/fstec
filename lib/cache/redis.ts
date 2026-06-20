import "server-only"

import Redis from "ioredis"

const DEFAULT_DASHBOARD_CACHE_TTL_SECONDS = 300
const DEFAULT_REFERENCE_CACHE_TTL_SECONDS = 900

function parseTtlSeconds(
  envValue: string | undefined,
  fallback: number
): number {
  const parsed = Number(envValue)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function getDashboardCacheTtl(): number {
  return parseTtlSeconds(
    process.env.DASHBOARD_CACHE_TTL_SECONDS,
    DEFAULT_DASHBOARD_CACHE_TTL_SECONDS
  )
}

export function getReferenceCacheTtl(): number {
  return parseTtlSeconds(
    process.env.REFERENCE_CACHE_TTL_SECONDS,
    DEFAULT_REFERENCE_CACHE_TTL_SECONDS
  )
}

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

export function isRedisEnabled(): boolean {
  if (process.env.REDIS_URL?.trim()) return true
  return Boolean(
    process.env.REDIS_SENTINELS?.trim() && process.env.REDIS_MASTER_NAME?.trim()
  )
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

