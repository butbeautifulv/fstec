import { describe, expect, it } from "vitest"
import {
  DEFAULT_LOCALE,
  isLocaleId,
  localeLabel,
  LOCALE_IDS,
  resolveLocale,
  SUPPORTED_LOCALES,
} from "@/lib/i18n/locales"

describe("SUPPORTED_LOCALES", () => {
  it("includes ru and en", () => {
    expect(SUPPORTED_LOCALES.map((l) => l.id)).toEqual(["ru", "en"])
  })
})

describe("LOCALE_IDS", () => {
  it("matches supported locale ids", () => {
    expect(LOCALE_IDS).toEqual(["ru", "en"])
  })
})

describe("isLocaleId", () => {
  it("accepts supported locales", () => {
    expect(isLocaleId("ru")).toBe(true)
    expect(isLocaleId("en")).toBe(true)
  })

  it("rejects unknown or empty values", () => {
    expect(isLocaleId("de")).toBe(false)
    expect(isLocaleId(null)).toBe(false)
    expect(isLocaleId(undefined)).toBe(false)
  })
})

describe("resolveLocale", () => {
  it("prefers user locale when valid", () => {
    expect(resolveLocale("en", "ru")).toBe("en")
  })

  it("falls back to global locale", () => {
    expect(resolveLocale(null, "en")).toBe("en")
  })

  it("falls back to default locale", () => {
    expect(resolveLocale(null, null)).toBe(DEFAULT_LOCALE)
    expect(resolveLocale("invalid", "also-invalid")).toBe(DEFAULT_LOCALE)
  })
})

describe("localeLabel", () => {
  it("returns human label for locale", () => {
    expect(localeLabel("ru")).toBe("Русский")
    expect(localeLabel("en")).toBe("English")
  })

  it("returns id for unknown locale at type level escape hatch", () => {
    expect(localeLabel("ru")).toBeTruthy()
    expect(localeLabel("xx" as "ru")).toBe("xx")
  })
})
