import { afterEach, describe, expect, it, vi } from "vitest"

describe("session-config", () => {
  afterEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it("uses SESSION_SECRET when long enough", async () => {
    vi.stubEnv("SESSION_SECRET", "a".repeat(32))
    const { sessionOptions } = await import("@/lib/auth/session-config")
    expect(sessionOptions.password).toBe("a".repeat(32))
  })

  it("throws in production when SESSION_SECRET is too short", async () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("SESSION_SECRET", "short")
    await expect(import("@/lib/auth/session-config")).rejects.toThrow(
      "SESSION_SECRET must be at least 32 characters"
    )
  })

  it("falls back to development secret outside production", async () => {
    vi.stubEnv("NODE_ENV", "development")
    vi.unstubAllEnvs()
    vi.stubEnv("NODE_ENV", "development")
    const { sessionOptions } = await import("@/lib/auth/session-config")
    expect(sessionOptions.password).toBe("development-secret-minimum-32-characters-long")
  })
})
