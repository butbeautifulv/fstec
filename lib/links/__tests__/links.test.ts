import { describe, expect, it } from "vitest"
import { activeLinkWhere } from "@/lib/links/active-where"
import { generateLinkToken } from "@/lib/links/generate-token"

describe("activeLinkWhere", () => {
  it("requires non-revoked links", () => {
    expect(activeLinkWhere().revokedAt).toBeNull()
  })

  it("allows null expiry or future expiry", () => {
    const where = activeLinkWhere()
    expect(where.OR).toEqual([
      { expiresAt: null },
      { expiresAt: { gt: expect.any(Date) } },
    ])
  })
})

describe("generateLinkToken", () => {
  it("returns base64url string", () => {
    const token = generateLinkToken()
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it("generates unique tokens", () => {
    const a = generateLinkToken()
    const b = generateLinkToken()
    expect(a).not.toBe(b)
  })

  it("has consistent length for 32 random bytes", () => {
    expect(generateLinkToken().length).toBe(43)
  })
})
