import type { PeriodBounds } from "@/lib/dashboard/period-bounds"
import {
  addDays,
  expandSingleDayBounds,
  formatDateIso,
  type PeriodRange,
} from "@/lib/dashboard/period-range"

export function boundsFromIsoDates(dates: (string | null | undefined)[]): PeriodBounds {
  const days = dates
    .map((d) => d?.slice(0, 10))
    .filter((d): d is string => Boolean(d))
    .sort()

  const today = formatDateIso(new Date())
  if (days.length === 0) {
    return { min: formatDateIso(addDays(new Date(), -365)), max: today }
  }

  return expandSingleDayBounds({
    min: days[0]!,
    max: days[days.length - 1]! > today ? today : days[days.length - 1]!,
  })
}

export function filterRowsByPeriod<T extends { createdAt?: string; submittedAt?: string | null }>(
  rows: T[],
  period: PeriodRange,
  field: "createdAt" | "submittedAt" = "createdAt"
): T[] {
  if (period.preset === "all" && !period.from && !period.to) return rows

  return rows.filter((row) => {
    const value = field === "submittedAt" ? row.submittedAt : row.createdAt
    if (!value) return false
    const day = value.slice(0, 10)
    if (period.from && day < period.from) return false
    if (period.to && day > period.to) return false
    return true
  })
}
