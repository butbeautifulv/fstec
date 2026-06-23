import type { DashboardScope } from "@/lib/dashboard/stats"

export type PeriodPreset = "30d" | "90d" | "1y" | "all"

export type PeriodRange = {
  from?: string
  to?: string
  preset?: PeriodPreset
}

export function formatDateIso(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function expandSingleDayBounds(
  bounds: PeriodBounds,
  windowDays = 90
): PeriodBounds {
  if (bounds.min === bounds.max) {
    return {
      min: formatDateIso(
        addDays(new Date(`${bounds.min}T00:00:00.000Z`), -windowDays)
      ),
      max: bounds.max,
    }
  }
  return bounds
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

export type PeriodBounds = {
  min: string
  max: string
}

export function defaultPeriodForBounds(bounds: PeriodBounds): PeriodRange {
  const total = Math.max(1, dayIndex(bounds.max, bounds.min))
  const window = Math.min(90, total)
  return {
    preset: "90d",
    from: indexToDay(Math.max(0, total - window), bounds.min),
    to: bounds.max,
  }
}

export function presetToRangeWithBounds(
  preset: PeriodPreset,
  bounds: PeriodBounds
): PeriodRange {
  if (preset === "all") return { preset: "all" }
  const total = Math.max(1, dayIndex(bounds.max, bounds.min))
  const days = preset === "30d" ? 30 : preset === "1y" ? 365 : 90
  const fromIdx = Math.max(0, total - days)
  return {
    preset,
    from: indexToDay(fromIdx, bounds.min),
    to: bounds.max,
  }
}

export function alignPeriodToBounds(
  period: PeriodRange,
  bounds: PeriodBounds
): PeriodRange {
  if (period.preset === "all" && !period.from && !period.to) return period

  let from = period.from ?? bounds.min
  let to = period.to ?? bounds.max
  if (from < bounds.min) from = bounds.min
  if (from > bounds.max) from = bounds.min
  if (to > bounds.max) to = bounds.max
  if (to < bounds.min) to = bounds.min
  if (from > to) from = to

  return { ...period, from, to }
}

export function presetToRange(preset: PeriodPreset, today = new Date()): PeriodRange {
  const to = formatDateIso(today)
  if (preset === "all") return { preset: "all" }
  if (preset === "30d") {
    return { preset, from: formatDateIso(addDays(today, -30)), to }
  }
  if (preset === "1y") {
    return { preset, from: formatDateIso(addDays(today, -365)), to }
  }
  return { preset: "90d", from: formatDateIso(addDays(today, -90)), to }
}

export function parsePeriodFromSearchParams(
  searchParams: {
    from?: string
    to?: string
    period?: string
  },
  bounds?: PeriodBounds
): PeriodRange {
  const from = searchParams.from
  const to = searchParams.to
  const presetRaw = searchParams.period

  let period: PeriodRange
  if (from || to) {
    period = { from, to, preset: isPeriodPreset(presetRaw) ? presetRaw : undefined }
  } else if (isPeriodPreset(presetRaw)) {
    period =
      presetRaw === "all"
        ? { preset: "all" }
        : bounds
          ? presetToRangeWithBounds(presetRaw, bounds)
          : presetToRange(presetRaw)
  } else {
    period = bounds ? defaultPeriodForBounds(bounds) : presetToRange("90d")
  }

  return bounds ? alignPeriodToBounds(period, bounds) : period
}

function isPeriodPreset(value: string | undefined): value is PeriodPreset {
  return value === "30d" || value === "90d" || value === "1y" || value === "all"
}

export function periodToDashboardScope(
  period: PeriodRange
): Pick<DashboardScope, "issuedFrom" | "issuedTo"> {
  if (period.preset === "all" && !period.from && !period.to) return {}

  const from = period.from
  const to = period.to
  const issuedFrom = from ? new Date(`${from}T00:00:00.000Z`) : undefined
  const issuedTo = to ? new Date(`${to}T23:59:59.999Z`) : undefined

  if (!issuedFrom && !issuedTo) return {}
  return { issuedFrom, issuedTo }
}

export function mergeDashboardScope(
  scope: DashboardScope,
  period: PeriodRange
): DashboardScope {
  return { ...scope, ...periodToDashboardScope(period) }
}

/** @deprecated Use parsePeriodFromSearchParams */
export function parseDashboardDateRange(searchParams: {
  from?: string
  to?: string
}): Pick<DashboardScope, "issuedFrom" | "issuedTo"> {
  return periodToDashboardScope(parsePeriodFromSearchParams(searchParams))
}

export function preservePeriodSearchParams(
  searchParams: URLSearchParams | { toString(): string }
): URLSearchParams {
  const params = new URLSearchParams(searchParams.toString())
  return params
}

export function periodSearchParams(period: PeriodRange): URLSearchParams {
  const params = new URLSearchParams()
  if (period.preset === "all") {
    params.set("period", "all")
  } else if (period.preset) {
    params.set("period", period.preset)
  }
  if (period.from) params.set("from", period.from)
  if (period.to) params.set("to", period.to)
  return params
}

export function dayIndex(dateIso: string, minIso: string): number {
  const date = new Date(`${dateIso}T00:00:00.000Z`)
  const min = new Date(`${minIso}T00:00:00.000Z`)
  return Math.round((date.getTime() - min.getTime()) / 86_400_000)
}

export function indexToDay(index: number, minIso: string): string {
  const min = new Date(`${minIso}T00:00:00.000Z`)
  return formatDateIso(addDays(min, index))
}

export function clampSliderRange(
  from: string,
  to: string,
  minDate: string,
  maxDate: string
): [number, number] {
  const total = Math.max(1, dayIndex(maxDate, minDate))
  const fromIdx = Math.max(0, Math.min(dayIndex(from, minDate), total))
  const toIdx = Math.max(fromIdx, Math.min(dayIndex(to, minDate), total))
  return [fromIdx, toIdx]
}

export function isDateInPeriod(
  dateIso: string | null | undefined,
  period: PeriodRange
): boolean {
  if (!dateIso) return false
  if (period.preset === "all" && !period.from && !period.to) return true
  const day = dateIso.slice(0, 10)
  if (period.from && day < period.from) return false
  if (period.to && day > period.to) return false
  return true
}
