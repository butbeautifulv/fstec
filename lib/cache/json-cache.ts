import "server-only"

import { getRedis } from "@/lib/cache/redis"

export async function getCachedJson<T>(
  key: string,
  ttlSec: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const redis = getRedis()

  if (redis) {
    try {
      const cached = await redis.get(key)
      if (cached) return JSON.parse(cached) as T
    } catch {
      // Fall through to fetcher on cache read errors.
    }
  }

  const value = await fetcher()

  if (redis && value != null) {
    try {
      await redis.setex(key, ttlSec, JSON.stringify(value))
    } catch {
      // Ignore cache write errors.
    }
  }

  return value
}

export async function invalidateKeys(...keys: string[]): Promise<void> {
  const redis = getRedis()
  if (!redis || keys.length === 0) return

  try {
    await redis.del(...keys)
  } catch {
    // Ignore cache invalidation errors.
  }
}

export async function invalidateKeysByPrefix(prefix: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return

  try {
    const keys = await redis.keys(`${prefix}*`)
    if (keys.length > 0) await redis.del(...keys)
  } catch {
    // Ignore cache invalidation errors.
  }
}
