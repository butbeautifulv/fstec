import { describe, expect, it } from "vitest"
import { THEME_BLOCKING_SCRIPT, THEME_STORAGE_KEY } from "@/lib/theme/blocking-script"

describe("THEME_STORAGE_KEY", () => {
  it("is theme", () => {
    expect(THEME_STORAGE_KEY).toBe("theme")
  })
})

describe("THEME_BLOCKING_SCRIPT", () => {
  it("embeds storage key and applies dark class logic", () => {
    expect(THEME_BLOCKING_SCRIPT).toContain('localStorage.getItem("theme")')
    expect(THEME_BLOCKING_SCRIPT).toContain('classList.add("dark")')
    expect(THEME_BLOCKING_SCRIPT).toContain('classList.remove("dark")')
    expect(THEME_BLOCKING_SCRIPT).toContain("prefers-color-scheme: dark")
  })

  it("is a self-invoking function", () => {
    expect(THEME_BLOCKING_SCRIPT.startsWith("(function(){")).toBe(true)
    expect(THEME_BLOCKING_SCRIPT.endsWith("})();")).toBe(true)
  })
})
