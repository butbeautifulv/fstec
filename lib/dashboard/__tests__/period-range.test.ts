import { describe, expect, it } from "vitest"
import {
  alignPeriodToBounds,
  clampSliderRange,
  dayIndex,
  defaultPeriodForBounds,
  expandSingleDayBounds,
  indexToDay,
  isDateInPeriod,
  parsePeriodFromSearchParams,
  periodSearchParams,
  periodToDashboardScope,
  presetToRange,
} from "@/lib/dashboard/period-range"

describe("parsePeriodFromSearchParams", () => {
  it("defaults to 90 days when no params", () => {
    const period = parsePeriodFromSearchParams({})
    expect(period.preset).toBe("90d")
    expect(period.from).toBeTruthy()
    expect(period.to).toBeTruthy()
  })

  it("parses explicit from/to", () => {
    const period = parsePeriodFromSearchParams({
      from: "2024-01-01",
      to: "2024-12-31",
    })
    expect(period.from).toBe("2024-01-01")
    expect(period.to).toBe("2024-12-31")
  })

  it("parses preset all", () => {
    const period = parsePeriodFromSearchParams({ period: "all" })
    expect(period.preset).toBe("all")
    expect(period.from).toBeUndefined()
  })
})

describe("presetToRange", () => {
  it("builds 30d range from reference date", () => {
    const today = new Date("2026-06-23T12:00:00.000Z")
    const period = presetToRange("30d", today)
    expect(period.from).toBe("2026-05-24")
    expect(period.to).toBe("2026-06-23")
  })
})

describe("periodToDashboardScope", () => {
  it("maps dates to issuedAt bounds", () => {
    const scope = periodToDashboardScope({
      from: "2024-06-01",
      to: "2024-06-30",
    })
    expect(scope.issuedFrom?.toISOString()).toBe("2024-06-01T00:00:00.000Z")
    expect(scope.issuedTo?.toISOString()).toBe("2024-06-30T23:59:59.999Z")
  })

  it("returns empty scope for all preset", () => {
    expect(periodToDashboardScope({ preset: "all" })).toEqual({})
  })
})

describe("isDateInPeriod", () => {
  it("includes dates inside range", () => {
    expect(
      isDateInPeriod("2024-06-15", { from: "2024-06-01", to: "2024-06-30" })
    ).toBe(true)
    expect(
      isDateInPeriod("2024-05-01", { from: "2024-06-01", to: "2024-06-30" })
    ).toBe(false)
  })

  it("allows all dates when preset is all", () => {
    expect(isDateInPeriod("2020-01-01", { preset: "all" })).toBe(true)
  })
})

describe("parsePeriodFromSearchParams with bounds", () => {
  const bounds = { min: "2024-01-01", max: "2024-12-31" }

  it("defaults to last 90 days within data bounds", () => {
    const period = parsePeriodFromSearchParams({}, bounds)
    expect(period.preset).toBe("90d")
    expect(period.from).toBe("2024-10-02")
    expect(period.to).toBe("2024-12-31")
  })

  it("aligns explicit dates to bounds", () => {
    const period = parsePeriodFromSearchParams(
      { from: "2023-01-01", to: "2026-06-23" },
      bounds
    )
    expect(period.from).toBe("2024-01-01")
    expect(period.to).toBe("2024-12-31")
  })
})

describe("defaultPeriodForBounds", () => {
  it("uses max bound as period end", () => {
    const period = defaultPeriodForBounds({ min: "2024-06-01", max: "2024-12-31" })
    expect(period.to).toBe("2024-12-31")
    expect(period.from).toBeTruthy()
  })
})

describe("alignPeriodToBounds", () => {
  it("clamps out-of-range preset dates", () => {
    const aligned = alignPeriodToBounds(
      { preset: "90d", from: "2026-01-01", to: "2026-06-23" },
      { min: "2024-01-01", max: "2024-12-31" }
    )
    expect(aligned.from).toBe("2024-01-01")
    expect(aligned.to).toBe("2024-12-31")
  })
})

describe("clampSliderRange", () => {
  it("clamps right thumb when period.to is after maxDate", () => {
    const [fromIdx, toIdx] = clampSliderRange(
      "2024-01-01",
      "2026-06-23",
      "2024-01-01",
      "2024-12-31"
    )
    expect(fromIdx).toBe(0)
    expect(toIdx).toBe(dayIndex("2024-12-31", "2024-01-01"))
  })

  it("keeps from index before to index", () => {
    const [fromIdx, toIdx] = clampSliderRange(
      "2026-06-23",
      "2026-06-23",
      "2024-01-01",
      "2024-12-31"
    )
    expect(fromIdx).toBeLessThanOrEqual(toIdx)
  })
})

describe("expandSingleDayBounds", () => {
  it("expands a single-day range backward", () => {
    const expanded = expandSingleDayBounds({
      min: "2026-06-23",
      max: "2026-06-23",
    })
    expect(expanded.max).toBe("2026-06-23")
    expect(expanded.min).toBe("2026-03-25")
  })

  it("keeps multi-day bounds unchanged", () => {
    const bounds = { min: "2024-01-01", max: "2024-12-31" }
    expect(expandSingleDayBounds(bounds)).toEqual(bounds)
  })
})

describe("periodSearchParams", () => {
  it("serializes preset all to URL and round-trips", () => {
    const params = periodSearchParams({ preset: "all" })
    expect(params.get("period")).toBe("all")
    expect(params.get("from")).toBeNull()
    expect(params.get("to")).toBeNull()

    const period = parsePeriodFromSearchParams(
      Object.fromEntries(params.entries())
    )
    expect(period.preset).toBe("all")
    expect(period.from).toBeUndefined()
    expect(period.to).toBeUndefined()
  })

  it("serializes preset with from/to", () => {
    const params = periodSearchParams({
      preset: "90d",
      from: "2024-10-01",
      to: "2024-12-31",
    })
    expect(params.get("period")).toBe("90d")
    expect(params.get("from")).toBe("2024-10-01")
    expect(params.get("to")).toBe("2024-12-31")
  })
})

describe("dayIndex helpers", () => {
  it("round-trips day indices", () => {
    const min = "2024-01-01"
    const idx = dayIndex("2024-01-10", min)
    expect(indexToDay(idx, min)).toBe("2024-01-10")
  })
})
