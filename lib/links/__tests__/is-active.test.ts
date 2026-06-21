import { describe, expect, it } from "vitest"
import { isRevocableLinkActive } from "@/lib/links/is-active"

describe("isRevocableLinkActive", () => {
  it("is inactive when revoked", () => {
    expect(
      isRevocableLinkActive({
        revokedAt: new Date("2026-01-01"),
        expiresAt: null,
      })
    ).toBe(false)
  })

  it("is inactive when expired", () => {
    expect(
      isRevocableLinkActive({
        revokedAt: null,
        expiresAt: new Date("2026-01-01"),
      })
    ).toBe(false)
  })

  it("is active when not revoked and not expired", () => {
    expect(
      isRevocableLinkActive({
        revokedAt: null,
        expiresAt: new Date("2027-01-01"),
      })
    ).toBe(true)
  })

  it("is active when expiresAt is null", () => {
    expect(
      isRevocableLinkActive({
        revokedAt: null,
        expiresAt: null,
      })
    ).toBe(true)
  })
})
