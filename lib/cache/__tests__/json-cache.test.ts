import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockRedis } from "@/lib/__tests__/helpers/mock-redis"

vi.mock("@/lib/cache/redis", () => ({
  getRedis: vi.fn(),
}))

import { getRedis } from "@/lib/cache/redis"
import { getCachedJson, invalidateKeys } from "@/lib/cache/json-cache"

const mockedGetRedis = vi.mocked(getRedis)

describe("getCachedJson", () => {
  beforeEach(() => {
    mockedGetRedis.mockReset()
  })

  it("returns cached value when redis hit", async () => {
    const redis = createMockRedis()
    redis.get.mockResolvedValue(JSON.stringify({ ok: true }))
    mockedGetRedis.mockReturnValue(redis as never)

    const fetcher = vi.fn().mockResolvedValue({ ok: false })
    const result = await getCachedJson("key", 60, fetcher)

    expect(result).toEqual({ ok: true })
    expect(fetcher).not.toHaveBeenCalled()
  })

  it("calls fetcher and stores value on miss", async () => {
    const redis = createMockRedis()
    mockedGetRedis.mockReturnValue(redis as never)

    const fetcher = vi.fn().mockResolvedValue([1, 2, 3])
    const result = await getCachedJson("list:orders", 300, fetcher)

    expect(result).toEqual([1, 2, 3])
    expect(fetcher).toHaveBeenCalledOnce()
    expect(redis.setex).toHaveBeenCalledWith("list:orders", 300, "[1,2,3]")
  })

  it("falls back to fetcher when redis read fails", async () => {
    const redis = {
      get: vi.fn().mockRejectedValue(new Error("redis down")),
      setex: vi.fn(),
    }
    mockedGetRedis.mockReturnValue(redis as never)

    const fetcher = vi.fn().mockResolvedValue("fresh")
    expect(await getCachedJson("key", 60, fetcher)).toBe("fresh")
  })

  it("skips cache write for null values", async () => {
    const redis = createMockRedis()
    mockedGetRedis.mockReturnValue(redis as never)

    await getCachedJson("key", 60, async () => null)
    expect(redis.setex).not.toHaveBeenCalled()
  })

  it("works without redis", async () => {
    mockedGetRedis.mockReturnValue(null)
    const fetcher = vi.fn().mockResolvedValue("direct")
    expect(await getCachedJson("key", 60, fetcher)).toBe("direct")
  })
})

describe("invalidateKeys", () => {
  it("deletes keys from redis", async () => {
    const redis = createMockRedis()
    mockedGetRedis.mockReturnValue(redis as never)
    await invalidateKeys("list:orders", "list:measures")
    expect(redis.del).toHaveBeenCalledWith("list:orders", "list:measures")
  })

  it("no-ops when redis unavailable", async () => {
    mockedGetRedis.mockReturnValue(null)
    await expect(invalidateKeys("key")).resolves.toBeUndefined()
  })

  it("no-ops when keys array is empty", async () => {
    const redis = createMockRedis()
    mockedGetRedis.mockReturnValue(redis as never)
    await invalidateKeys()
    expect(redis.del).not.toHaveBeenCalled()
  })

  it("ignores setex write errors and still returns fetched value", async () => {
    const redis = createMockRedis()
    redis.setex.mockRejectedValue(new Error("write failed"))
    mockedGetRedis.mockReturnValue(redis as never)

    const fetcher = vi.fn().mockResolvedValue({ fresh: true })
    expect(await getCachedJson("key", 60, fetcher)).toEqual({ fresh: true })
    expect(fetcher).toHaveBeenCalledOnce()
  })

  it("ignores del errors during invalidation", async () => {
    const redis = createMockRedis()
    redis.del.mockRejectedValue(new Error("del failed"))
    mockedGetRedis.mockReturnValue(redis as never)
    await expect(invalidateKeys("key")).resolves.toBeUndefined()
  })
})
