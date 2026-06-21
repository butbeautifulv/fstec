import { describe, expect, it, vi } from "vitest"
import {
  getDashboardCacheTtl,
  getReferenceCacheTtl,
  isRedisEnabled,
} from "@/lib/cache/redis-config"

describe("getDashboardCacheTtl", () => {
  it("defaults to 300 seconds", () => {
    expect(getDashboardCacheTtl()).toBe(300)
  })

  it("reads DASHBOARD_CACHE_TTL_SECONDS from env", () => {
    vi.stubEnv("DASHBOARD_CACHE_TTL_SECONDS", "600")
    expect(getDashboardCacheTtl()).toBe(600)
  })

  it("falls back for invalid env values", () => {
    vi.stubEnv("DASHBOARD_CACHE_TTL_SECONDS", "0")
    expect(getDashboardCacheTtl()).toBe(300)
    vi.stubEnv("DASHBOARD_CACHE_TTL_SECONDS", "not-a-number")
    expect(getDashboardCacheTtl()).toBe(300)
  })
})

describe("getReferenceCacheTtl", () => {
  it("defaults to 900 seconds", () => {
    expect(getReferenceCacheTtl()).toBe(900)
  })

  it("reads REFERENCE_CACHE_TTL_SECONDS from env", () => {
    vi.stubEnv("REFERENCE_CACHE_TTL_SECONDS", "1200")
    expect(getReferenceCacheTtl()).toBe(1200)
  })
})

describe("isRedisEnabled", () => {
  it("returns false when no redis env is set", () => {
    expect(isRedisEnabled()).toBe(false)
  })

  it("returns true when REDIS_URL is set", () => {
    vi.stubEnv("REDIS_URL", "redis://localhost:6379")
    expect(isRedisEnabled()).toBe(true)
  })

  it("returns true when sentinel config is complete", () => {
    vi.stubEnv("REDIS_SENTINELS", "host1:26379,host2:26379")
    vi.stubEnv("REDIS_MASTER_NAME", "mymaster")
    expect(isRedisEnabled()).toBe(true)
  })

  it("returns false when sentinel config is incomplete", () => {
    vi.stubEnv("REDIS_SENTINELS", "host1:26379")
    expect(isRedisEnabled()).toBe(false)
  })
})
