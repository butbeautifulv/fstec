import { afterEach, describe, expect, it } from "vitest"
import {
  formatDisplayDate,
  formatDisplayDateTime,
  isIsoDateString,
  toFilterDateKey,
} from "@/lib/datetime/format"
import {
  getFilterTimeZone,
  setFilterTimeZone,
} from "@/lib/datetime/filter-timezone"
import {
  DEFAULT_TIMEZONE,
  getTimezoneLabel,
  TIMEZONE_OPTIONS,
} from "@/lib/datetime/timezones"

describe("isIsoDateString", () => {
  it("matches ISO date prefix", () => {
    expect(isIsoDateString("2026-06-21T12:00:00.000Z")).toBe(true)
  })

  it("rejects non-ISO strings", () => {
    expect(isIsoDateString("21.06.2026")).toBe(false)
    expect(isIsoDateString("not-a-date")).toBe(false)
  })
})

describe("formatDisplayDate", () => {
  it("formats date in given timezone", () => {
    expect(formatDisplayDate("2026-06-21T21:00:00.000Z", "Europe/Moscow")).toBe(
      "22.06.2026"
    )
  })

  it("returns original string for invalid date", () => {
    expect(formatDisplayDate("invalid", "Europe/Moscow")).toBe("invalid")
  })
})

describe("formatDisplayDateTime", () => {
  it("formats date and time in given timezone", () => {
    const formatted = formatDisplayDateTime(
      "2026-06-21T12:30:00.000Z",
      "Europe/Moscow"
    )
    expect(formatted).toMatch(/21\.06\.2026/)
    expect(formatted).toMatch(/15:30/)
  })

  it("returns original string for invalid date", () => {
    expect(formatDisplayDateTime("bad", "Europe/Moscow")).toBe("bad")
  })
})

describe("toFilterDateKey", () => {
  it("returns YYYY-MM-DD in timezone", () => {
    expect(toFilterDateKey("2026-06-21T21:00:00.000Z", "Europe/Moscow")).toBe(
      "2026-06-22"
    )
  })

  it("returns original string for invalid date", () => {
    expect(toFilterDateKey("nope", "Europe/Moscow")).toBe("nope")
  })
})

describe("TIMEZONE_OPTIONS", () => {
  it("includes Moscow with UTC offset label", () => {
    const moscow = TIMEZONE_OPTIONS.find((z) => z.id === "Europe/Moscow")
    expect(moscow?.label).toMatch(/Москва/)
    expect(moscow?.label).toMatch(/UTC/)
  })
})

describe("getTimezoneLabel", () => {
  it("returns label for known timezone", () => {
    expect(getTimezoneLabel("Europe/Moscow")).toContain("Москва")
  })

  it("returns raw id for unknown timezone", () => {
    expect(getTimezoneLabel("Unknown/Zone")).toBe("Unknown/Zone")
  })
})

describe("filter timezone module state", () => {
  afterEach(() => {
    setFilterTimeZone(DEFAULT_TIMEZONE)
  })

  it("defaults to Europe/Moscow", () => {
    setFilterTimeZone(DEFAULT_TIMEZONE)
    expect(getFilterTimeZone()).toBe("Europe/Moscow")
  })

  it("stores custom timezone", () => {
    setFilterTimeZone("Asia/Vladivostok")
    expect(getFilterTimeZone()).toBe("Asia/Vladivostok")
  })
})
