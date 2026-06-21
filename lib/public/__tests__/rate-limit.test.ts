import { afterEach, describe, expect, it, vi } from "vitest"
import { createMockRedis } from "@/lib/__tests__/helpers/mock-redis"
import { checkRateLimitMemory } from "@/lib/public/rate-limit-memory"

vi.mock("@/lib/cache/redis", () => ({
  getRedis: vi.fn(),
}))

import { getRedis } from "@/lib/cache/redis"
import { checkRateLimit, checkRateLimitAsync } from "@/lib/public/rate-limit"

const mockedGetRedis = vi.mocked(getRedis)

describe("checkRateLimitMemory", () => {
  it("allows requests within limit", () => {
    const key = `memory-${Date.now()}`
    expect(checkRateLimitMemory(key, 3, 60_000)).toBe(true)
    expect(checkRateLimitMemory(key, 3, 60_000)).toBe(true)
    expect(checkRateLimitMemory(key, 3, 60_000)).toBe(true)
  })

  it("blocks requests over limit", () => {
    const key = `memory-block-${Date.now()}`
    expect(checkRateLimitMemory(key, 2, 60_000)).toBe(true)
    expect(checkRateLimitMemory(key, 2, 60_000)).toBe(true)
    expect(checkRateLimitMemory(key, 2, 60_000)).toBe(false)
  })
})

describe("checkRateLimit", () => {
  it("uses memory path synchronously", () => {
    const key = `sync-${Date.now()}`
    expect(checkRateLimit(key, 2, 60_000)).toBe(true)
    expect(checkRateLimit(key, 2, 60_000)).toBe(true)
    expect(checkRateLimit(key, 2, 60_000)).toBe(false)
  })
})

describe("checkRateLimitAsync", () => {
  afterEach(() => {
    mockedGetRedis.mockReset()
  })

  it("falls back to memory when redis is unavailable", async () => {
    mockedGetRedis.mockReturnValue(null)
    const key = `async-no-redis-${Date.now()}`
    expect(await checkRateLimitAsync(key, 2, 60_000)).toBe(true)
    expect(await checkRateLimitAsync(key, 2, 60_000)).toBe(true)
    expect(await checkRateLimitAsync(key, 2, 60_000)).toBe(false)
  })

  it("uses redis incr/expire when available", async () => {
    const redis = createMockRedis()
    mockedGetRedis.mockReturnValue(redis as never)
    const key = `async-redis-${Date.now()}`

    expect(await checkRateLimitAsync(key, 3, 60_000)).toBe(true)
    expect(await checkRateLimitAsync(key, 3, 60_000)).toBe(true)
    expect(await checkRateLimitAsync(key, 3, 60_000)).toBe(true)
    expect(await checkRateLimitAsync(key, 3, 60_000)).toBe(false)

    expect(redis.incr).toHaveBeenCalledWith(`rate:${key}`)
    expect(redis.expire).toHaveBeenCalledWith(`rate:${key}`, 60)
  })

  it("does not reset expire window on subsequent redis hits", async () => {
    const redis = createMockRedis()
    mockedGetRedis.mockReturnValue(redis as never)
    const key = `async-redis-repeat-${Date.now()}`

    await checkRateLimitAsync(key, 5, 60_000)
    await checkRateLimitAsync(key, 5, 60_000)

    expect(redis.expire).toHaveBeenCalledTimes(1)
  })

  it("falls back to memory when redis throws", async () => {
    const redis = {
      incr: vi.fn().mockRejectedValue(new Error("redis down")),
      expire: vi.fn(),
    }
    mockedGetRedis.mockReturnValue(redis as never)
    const key = `async-redis-fail-${Date.now()}`

    expect(await checkRateLimitAsync(key, 2, 60_000)).toBe(true)
    expect(await checkRateLimitAsync(key, 2, 60_000)).toBe(true)
    expect(await checkRateLimitAsync(key, 2, 60_000)).toBe(false)
  })
})
