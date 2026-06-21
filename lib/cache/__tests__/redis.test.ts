import { afterEach, describe, expect, it, vi } from "vitest"

const mockOn = vi.hoisted(() => vi.fn())
const RedisMock = vi.hoisted(() =>
  vi.fn(function RedisMock(this: { on: typeof mockOn }) {
    this.on = mockOn
  })
)

vi.mock("ioredis", () => ({
  default: RedisMock,
}))

describe("getRedis", () => {
  afterEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
    RedisMock.mockClear()
    mockOn.mockClear()
  })

  it("returns null when no redis config", async () => {
    const { getRedis } = await import("@/lib/cache/redis")
    expect(getRedis()).toBeNull()
  })

  it("creates client from REDIS_URL", async () => {
    vi.stubEnv("REDIS_URL", "redis://localhost:6379")
    const { getRedis } = await import("@/lib/cache/redis")
    const client = getRedis()
    expect(RedisMock).toHaveBeenCalledWith("redis://localhost:6379", {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    })
    expect(client).toBeTruthy()
    expect(mockOn).toHaveBeenCalledWith("error", expect.any(Function))
  })

  it("creates client from REDIS_SENTINELS and REDIS_MASTER_NAME", async () => {
    vi.stubEnv("REDIS_SENTINELS", "host1:26379,host2:26380")
    vi.stubEnv("REDIS_MASTER_NAME", "mymaster")
    const { getRedis } = await import("@/lib/cache/redis")
    getRedis()
    expect(RedisMock).toHaveBeenCalledWith({
      sentinels: [
        { host: "host1", port: 26379 },
        { host: "host2", port: 26380 },
      ],
      name: "mymaster",
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    })
  })

  it("uses default sentinel port when omitted", async () => {
    vi.stubEnv("REDIS_SENTINELS", "host1")
    vi.stubEnv("REDIS_MASTER_NAME", "mymaster")
    const { getRedis } = await import("@/lib/cache/redis")
    getRedis()
    expect(RedisMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sentinels: [{ host: "host1", port: 26379 }],
      })
    )
  })

  it("caches client on subsequent calls", async () => {
    vi.stubEnv("REDIS_URL", "redis://localhost:6379")
    const { getRedis } = await import("@/lib/cache/redis")
    const first = getRedis()
    const second = getRedis()
    expect(first).toBe(second)
    expect(RedisMock).toHaveBeenCalledTimes(1)
  })

  it("error handler swallows redis errors", async () => {
    vi.stubEnv("REDIS_URL", "redis://localhost:6379")
    const { getRedis } = await import("@/lib/cache/redis")
    getRedis()
    const handler = mockOn.mock.calls.find(([event]) => event === "error")?.[1]
    expect(() => handler?.(new Error("connection lost"))).not.toThrow()
  })

  it("re-exports redis config helpers", async () => {
    vi.stubEnv("REDIS_URL", "redis://localhost:6379")
    const redis = await import("@/lib/cache/redis")
    expect(typeof redis.getDashboardCacheTtl).toBe("function")
    expect(typeof redis.getReferenceCacheTtl).toBe("function")
    expect(typeof redis.isRedisEnabled).toBe("function")
    expect(redis.isRedisEnabled()).toBe(true)
  })
})
