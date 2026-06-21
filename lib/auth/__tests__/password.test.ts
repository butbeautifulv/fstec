import { describe, expect, it } from "vitest"
import { hashPassword, verifyPassword } from "@/lib/auth/password"

describe("hashPassword", () => {
  it("returns a bcrypt hash different from the plain password", async () => {
    const hash = await hashPassword("Str0ng!Passw0rd")
    expect(hash).not.toBe("Str0ng!Passw0rd")
    expect(hash.startsWith("$2")).toBe(true)
  })
})

describe("verifyPassword", () => {
  it("returns true for matching password and hash", async () => {
    const password = "Str0ng!Passw0rd"
    const hash = await hashPassword(password)
    expect(await verifyPassword(password, hash)).toBe(true)
  })

  it("returns false for wrong password", async () => {
    const hash = await hashPassword("correct-password")
    expect(await verifyPassword("wrong-password", hash)).toBe(false)
  })
})
