import Redis from "ioredis"

const DASHBOARD_CACHE_TTL_SECONDS = 60

let client: Redis | null | undefined

export function isRedisEnabled(): boolean {
  return Boolean(process.env.REDIS_URL?.trim())
}

export function getRedis(): Redis | null {
  if (client !== undefined) return client

  const url = process.env.REDIS_URL?.trim()
  if (!url) {
    client = null
    return client
  }

  client = new Redis(url, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
  })

  client.on("error", () => {
    // Redis is optional; avoid crashing the app on cache errors.
  })

  return client
}

export { DASHBOARD_CACHE_TTL_SECONDS }
