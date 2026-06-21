import Redis from "ioredis"

const KEY_PREFIX = "nextjs:"

/** @type {Redis | null | undefined} */
let client

function parseSentinels(raw) {
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [host, port = "26379"] = entry.split(":")
      return { host, port: Number(port) }
    })
}

function createRedisClient() {
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

function getRedis() {
  if (client !== undefined) return client

  client = createRedisClient()
  if (client) {
    client.on("error", () => {
      // Redis is optional; avoid crashing the app on cache errors.
    })
  }

  return client
}

function prefixedKey(key) {
  return `${KEY_PREFIX}${key}`
}

/**
 * Next.js shared incremental cache on Redis.
 * Tag-based invalidation (`revalidateTag`) is intentionally a no-op in v1 —
 * use app-level `invalidateKeys` for domain caches until tag indexing is added.
 */
export default class CacheHandler {
  constructor(options) {
    void options
  }

  async get(key) {
    const redis = getRedis()
    if (!redis) return null

    try {
      const cached = await redis.get(prefixedKey(key))
      if (!cached) return null
      return JSON.parse(cached)
    } catch {
      return null
    }
  }

  async set(key, data, ctx) {
    const redis = getRedis()
    if (!redis) return

    const ttl =
      typeof ctx?.revalidate === "number" && ctx.revalidate > 0
        ? ctx.revalidate
        : 3600

    try {
      await redis.setex(prefixedKey(key), ttl, JSON.stringify(data))
    } catch {
      // Ignore cache write errors.
    }
  }

  async revalidateTag(tag) {
    void tag
    // No-op: full tag invalidation needs a reverse index (planned follow-up).
  }

  resetRequestCache() {
    // Per-request in-memory layer is disabled via cacheMaxMemorySize: 0.
  }
}
