import { describe, expect, it } from "vitest"
import {
  generateSecurePassword,
  MIN_PASSWORD_LENGTH,
  validatePassword,
} from "@/lib/auth/password-policy"

describe("validatePassword", () => {
  it("rejects short passwords", () => {
    const result = validatePassword("Short1!")
    expect(result.valid).toBe(false)
    expect(result.unmet.length).toBeGreaterThan(0)
  })

  it("accepts strong password", () => {
    const result = validatePassword("Str0ng!Passw0rdLong")
    expect(result.valid).toBe(true)
    expect(result.unmet).toEqual([])
  })

  it("reports missing character classes", () => {
    const result = validatePassword("alllowercaselettersonly")
    expect(result.valid).toBe(false)
    expect(result.unmet.some((label) => label.includes("Заглавная"))).toBe(true)
    expect(result.unmet.some((label) => label.includes("Цифра"))).toBe(true)
  })
})

describe("generateSecurePassword", () => {
  it("generates password of requested length", () => {
    expect(generateSecurePassword(20).length).toBe(20)
  })

  it("defaults to minimum length", () => {
    expect(generateSecurePassword().length).toBe(MIN_PASSWORD_LENGTH)
  })

  it("passes validation", () => {
    expect(validatePassword(generateSecurePassword()).valid).toBe(true)
  })
})
