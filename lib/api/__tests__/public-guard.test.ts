import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/cache/redis", () => ({
  getRedis: vi.fn(),
}))

import { getRedis } from "@/lib/cache/redis"
import {
  assertPublicRateLimit,
  getClientIp,
} from "@/lib/api/public-guard"
import { checkRateLimitAsync } from "@/lib/public/rate-limit"

const mockedGetRedis = vi.mocked(getRedis)

describe("getClientIp", () => {
  it("reads x-forwarded-for header", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    })
    expect(getClientIp(req)).toBe("1.2.3.4")
  })

  it("falls back to local", () => {
    expect(getClientIp(new Request("http://localhost"))).toBe("local")
  })
})

describe("assertPublicRateLimit", () => {
  beforeEach(() => {
    mockedGetRedis.mockReset()
  })

  it("returns null when under limit", async () => {
    mockedGetRedis.mockReturnValue(null)
    const result = await assertPublicRateLimit(
      new Request("http://localhost"),
      "token-1",
      "write"
    )
    expect(result).toBeNull()
  })

  it("returns 429 when over limit", async () => {
    mockedGetRedis.mockReturnValue(null)
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "9.9.9.9" },
    })
    const key = "public-write:9.9.9.9:token-1"

    for (let i = 0; i < 60; i++) {
      await checkRateLimitAsync(key, 60, 60_000)
    }

    const result = await assertPublicRateLimit(req, "token-1", "write")
    expect(result?.status).toBe(429)
  })

  it("uses read scope key", async () => {
    mockedGetRedis.mockReturnValue(null)
    await assertPublicRateLimit(new Request("http://localhost"), "token-1", "read")
    // smoke: no throw, read scope uses public: prefix internally
  })
})
