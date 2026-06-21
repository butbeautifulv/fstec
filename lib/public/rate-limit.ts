import { getRedis } from "@/lib/cache/redis"
import { checkRateLimitMemory } from "@/lib/public/rate-limit-memory"

async function checkRateLimitRedis(
  key: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const redis = getRedis()
  if (!redis) return checkRateLimitMemory(key, limit, windowMs)

  const redisKey = `rate:${key}`
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000))

  try {
    const count = await redis.incr(redisKey)
    if (count === 1) {
      await redis.expire(redisKey, windowSec)
    }
    return count <= limit
  } catch {
    return checkRateLimitMemory(key, limit, windowMs)
  }
}

export function checkRateLimit(
  key: string,
  limit = 60,
  windowMs = 60_000
): boolean {
  return checkRateLimitMemory(key, limit, windowMs)
}

export async function checkRateLimitAsync(
  key: string,
  limit = 60,
  windowMs = 60_000
): Promise<boolean> {
  if (!getRedis()) {
    return checkRateLimitMemory(key, limit, windowMs)
  }
  return checkRateLimitRedis(key, limit, windowMs)
}
