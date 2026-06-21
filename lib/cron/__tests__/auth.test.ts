import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { assertCronSecret } from "@/lib/cron/auth"
import { getCronSecret } from "@/lib/email/config"

vi.mock("@/lib/email/config", () => ({
  getCronSecret: vi.fn(),
}))

const mockedGetCronSecret = vi.mocked(getCronSecret)

describe("assertCronSecret", () => {
  beforeEach(() => {
    mockedGetCronSecret.mockReturnValue("secret-token")
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("accepts valid Bearer token", () => {
    const request = new Request("http://localhost", {
      headers: { authorization: "Bearer secret-token" },
    })
    expect(() => assertCronSecret(request)).not.toThrow()
  })

  it("accepts x-cron-secret header", () => {
    const request = new Request("http://localhost", {
      headers: { "x-cron-secret": "secret-token" },
    })
    expect(() => assertCronSecret(request)).not.toThrow()
  })

  it("throws FORBIDDEN for wrong secret", () => {
    const request = new Request("http://localhost", {
      headers: { authorization: "Bearer wrong" },
    })
    expect(() => assertCronSecret(request)).toThrow("FORBIDDEN")
  })

  it("throws FORBIDDEN when cron secret not configured", () => {
    mockedGetCronSecret.mockReturnValue(undefined)
    const request = new Request("http://localhost", {
      headers: { authorization: "Bearer secret-token" },
    })
    expect(() => assertCronSecret(request)).toThrow("FORBIDDEN")
  })
})
